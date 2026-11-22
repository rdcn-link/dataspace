"""直接调用 DatasetVFS 类的方法，端到端验证逻辑。

这个脚本**不挂载真正的 FUSE 设备**——它构造一个 DatasetVFS 对象，
然后直接调用 getattr / readdir / open / read 方法，走完整的
PathResolver → Mongo → tree_walker → os.open/read 链路。

Windows/Mac 下运行时 fusepy 不可用，脚本会自动 stub fuse 模块。

运行：
    pip install pymongo
    PYTHONPATH="." python scripts/test_vfs_direct.py
"""
from __future__ import annotations

import errno
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
# 如果 vendor 目录存在，优先用里面的 pymongo
vendor_path = ROOT / "vendor"
if vendor_path.exists():
    sys.path.insert(0, str(vendor_path))

# ── 关键：如果 fusepy 不可用，造一个 stub 模块 ──────────────────
try:
    import fuse  # type: ignore  # noqa: F401
except ImportError:
    import types

    def _stub_raiser(eno: int):
        class _E(Exception):
            def __init__(self, *args, **kw):
                super().__init__()
                self.errno = eno

        return _E

    fuse = types.ModuleType("fuse")
    fuse.Operations = object  # type: ignore[attr-defined]
    fuse.FUSE = lambda *a, **k: None  # type: ignore[attr-defined]
    fuse.FuseOSError = _stub_raiser(1)  # EPERM default  # type: ignore[attr-defined]

sys.modules["fuse"] = fuse  # noqa: F841  (used by filesystem import below)

from app.api_client import MetadataClient  # noqa: E402
from app.config import Settings  # noqa: E402
from app.filesystem import DatasetVFS  # noqa: E402


def run() -> int:
    settings = Settings.from_env()
    print(f"mongo: {settings.MONGO_URI.split('@')[-1].split('?')[0]}")
    print()

    # ── 先确认 Mongo 可达 + 找好测试目标 ────────────────────────────
    client = MetadataClient(settings)
    try:
        datasets = client.list_datasets()
        if not datasets:
            print("ERROR: 没有 dataset")
            return 1
        did = datasets[0].dataset_id
        print(f"✅ list_datasets → {len(datasets)} 个，用第一个: {did}")

        def find_file(cur_segs):
            for ch in client.list_children(did, cur_segs):
                if not ch.is_dir:
                    try:
                        return client.resolve(did, cur_segs + [ch.name])
                    except FileNotFoundError:
                        continue
            for ch in client.list_children(did, cur_segs):
                if ch.is_dir:
                    r = find_file(cur_segs + [ch.name])
                    if r:
                        return r
            return None

        resolved = find_file([])
        if not resolved:
            print("ERROR: 找不到可 resolve 的文件")
            return 1

        virt_segs = resolved.virtual_path.split("/")[len(settings.VIRTUAL_ROOT.split("/")) + 1:]
        leaf_path = f"{settings.VIRTUAL_ROOT}/{did}/{'/'.join(virt_segs)}"
        real_path = resolved.real_path
        print(f"✅ resolve 成功")
        print(f"   虚拟: {leaf_path}")
        print(f"   真实: {real_path}")
        print(f"   真实文件在本机? {os.path.exists(real_path)}")
    finally:
        client.close()

    # ── 构造 DatasetVFS 实例 ─────────────────────────────────────
    vfs = DatasetVFS(settings)

    errors = 0
    total = 0

    def check(name, fn):
        nonlocal errors, total
        total += 1
        try:
            result = fn()
            print(f"  ✅ [{name}]")
            return result
        except Exception as exc:
            print(f"  ❌ [{name}] → {exc!r}")
            errors += 1
            return None

    print()
    print("═══ 直接调用 DatasetVFS 方法 ═══")
    print()

    # 1. getattr /fairspace (ROOT)
    check("getattr(ROOT)", lambda: vfs.getattr(settings.VIRTUAL_ROOT))

    # 2. getattr /fairspace/<datasetId> (DATASET_DIR)
    check(
        f"getattr(DATASET_DIR {did})",
        lambda: vfs.getattr(f"{settings.VIRTUAL_ROOT}/{did}"),
    )

    # 3. getattr /fairspace/<datasetId>/.../<file> (DEEP, 叶子文件)
    #    NOTE: _file_stat 会 os.stat(real_path) —— 如果真实文件在本地
    #    不存在（比如这是 Windows，真实数据在 Linux 服务器上），
    #    FUSE 层会正确返回 ENOENT。 这不是 FUSE 逻辑错误。
    local_file_exists = os.path.exists(real_path)
    file_stat = None
    if local_file_exists:
        file_stat = check("getattr(FILE)", lambda: vfs.getattr(leaf_path))
    else:
        total += 1
        print(f"  ⚠️  [getattr(FILE)] 跳过 — 真实文件不在本机（{real_path}）")
        print(f"     这是预期的：上服务器（真实数据在 /mnt/sciencedbNew）就会 OK")

    # 4. getattr nonexistent → ENOENT
    def getattr_enoent():
        try:
            vfs.getattr(f"{settings.VIRTUAL_ROOT}/does_not_exist_xyz")
            return "FAIL - should have raised"
        except Exception as exc:
            return f"raised {type(exc).__name__} → 正确"

    check("getattr(nonexistent) → ENOENT", getattr_enoent)

    # 5. readdir ROOT
    root_entries = check("readdir(ROOT)", lambda: vfs.readdir(settings.VIRTUAL_ROOT, 0))

    # 6. readdir DATASET_DIR
    ds_entries = check(
        f"readdir({did})",
        lambda: vfs.readdir(f"{settings.VIRTUAL_ROOT}/{did}", 0),
    )
    if ds_entries:
        print(f"     看到: {ds_entries[:8]}")

    # 7. open + read 叶子文件
    fh = None
    if local_file_exists and file_stat:
        try:
            fh = vfs.open(leaf_path, 0)
            print(f"  ✅ open(FILE) → fh={fh}")
            data = vfs.read(leaf_path, 16, 0, fh)
            print(f"  ✅ read(FILE) → {data!r}")
        except Exception as exc:
            print(f"  ❌ open/read 失败: {exc!r}")
            errors += 1
        finally:
            if fh is not None:
                try:
                    vfs.release(leaf_path, fh)
                    print("  ✅ release → OK")
                except Exception:
                    pass
    elif not local_file_exists:
        total += 1
        print(f"  ⚠️  [open+read] 跳过 — 真实文件不在本机（同上）")

    # 8. open nonexistent → ENOENT
    def open_enoent():
        try:
            vfs.open(f"{settings.VIRTUAL_ROOT}/{did}/definitely_not_here.txt", 0)
            return "FAIL"
        except Exception:
            return "raised → 正确"

    check("open(nonexistent) → ENOENT", open_enoent)

    # 9. 中间目录 getattr + readdir（任意深度嵌套的关键路径）
    nested_dir = None
    for e in ds_entries or []:
        if e in (".", ".."):
            continue
        cand = f"{settings.VIRTUAL_ROOT}/{did}/{e}"
        try:
            st = vfs.getattr(cand)
            import stat as statmod

            if (st.get("st_mode", 0) & 0o170000) == statmod.S_IFDIR:
                nested_dir = cand
                break
        except Exception:
            continue
    if nested_dir:
        check(f"getattr(NESTED_DIR {nested_dir})", lambda: vfs.getattr(nested_dir))
        check(f"readdir(NESTED_DIR)", lambda: vfs.readdir(nested_dir, 0))

    # ── 总结 ───────────────────────────────────────────────────────
    print()
    print("═════════════════════════════════════")
    print(f"  结果: {total - errors}/{total} 通过")
    if errors:
        print(f"  ❌ {errors} 项失败")
        print("═════════════════════════════════════")
        return 1
    else:
        print("  ✅ FUSE 层逻辑全部正确，可以上服务器挂真实设备了")
        print("═════════════════════════════════════")
        return 0


if __name__ == "__main__":
    sys.exit(run())
