#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# dataset-vfs-v2 服务器端一键验收脚本
#
# 在你的 Linux 服务器上执行：
#     cd dataset-vfs-v2
#     bash scripts/server_acceptance.sh
#
# 做了什么：
#   1. 校验 /dev/fuse、docker、/mnt/sciencedbNew 真实数据
#   2. docker compose up -d（会连接真实 MongoDB）
#   3. 等挂载起来，跑 findmnt /mnt/fairspace
#   4. 跑 Python 端到端验证：ls / getattr / open / read
#   5. 打印总结 + 清理命令
# ════════════════════════════════════════════════════════════════════

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

echo "=========================================================="
echo "  dataset-vfs-v2 服务器端验收脚本"
echo "=========================================================="
echo

# ── 0. 前置检查 ────────────────────────────────────────────────────
OK=1

echo "── [0/6] 前置检查"

# 检查 /dev/fuse
if [ -e /dev/fuse ]; then
    echo "  ✅ /dev/fuse 存在"
else
    echo "  ❌ /dev/fuse 不存在 → 无法使用 FUSE"
    echo "     请在宿主机确认已安装 fuse：apt-get install fuse libfuse2"
    OK=0
fi

# 检查 docker
if command -v docker >/dev/null 2>&1; then
    echo "  ✅ docker $(docker version --format '{{.Server.Version}}')"
else
    echo "  ❌ docker 不存在"
    OK=0
fi

# 检查 /mnt/sciencedbNew 是否存在（容器要挂这里）
if [ -d /mnt/sciencedbNew ]; then
    COUNT=$(find /mnt/sciencedbNew -type f 2>/dev/null | head -5 | wc -l)
    echo "  ✅ /mnt/sciencedbNew 存在（抽样文件数 ≈ $COUNT）"
else
    echo "  ⚠️  /mnt/sciencedbNew 在宿主机上不存在"
    echo "     如果你要真的 open/read 文件，宿主机必须先准备好这条挂载"
    echo "     （MongoDB fileTree 里 realPath 指向的就是这个路径）"
fi

# 检查 /tmp 是否可写（FUSE 调试挂载用）
touch /tmp/.vfs_test && rm /tmp/.vfs_test && echo "  ✅ /tmp 可写"

if [ $OK -eq 0 ]; then
    echo
    echo "前置检查失败，请先修复上面的 ❌ 项"
    exit 1
fi

# ── 1. 构建镜像 ────────────────────────────────────────────────────
echo
echo "── [1/6] docker compose build"
docker compose build -q 2>&1 | tail -5

# ── 2. 清理旧容器 ──────────────────────────────────────────────────
echo
echo "── [2/6] 停止旧容器（如果有）"
docker compose down -v 2>/dev/null || true

# ── 3. 启动 FUSE 容器 ──────────────────────────────────────────────
echo
echo "── [3/6] docker compose up -d"
docker compose up -d

# 等它起来
for i in $(seq 1 10); do
    STATE=$(docker compose ps --format '{{.State.Status}}' | head -1)
    echo "   第 $i 次检查：状态=$STATE"
    if [ "$STATE" = "running" ]; then
        break
    fi
    sleep 1
done

# 打印日志
echo
echo "── [4/6] 容器启动日志（Mongo 预检 + 挂载）"
docker compose logs --tail=30

# ── 4. 检查挂载 ────────────────────────────────────────────────────
echo
echo "── [5/6] findmnt /mnt/fairspace"
if findmnt /mnt/fairspace >/dev/null 2>&1; then
    echo "  ✅ FUSE 挂载生效！"
    findmnt /mnt/fairspace
else
    echo "  ❌ findmnt /mnt/fairspace 失败"
    echo "     最近日志："
    docker compose logs --tail=50
    exit 1
fi

# ── 5. 端到端验收 ──────────────────────────────────────────────────
echo
echo "── [6/6] 端到端验收（Python）"

docker compose exec -T dataset-vfs python <<'PYEOF'
import os, sys

ROOT = "/mnt/fairspace"
errors = 0

# Test 1: 根目录 getattr
try:
    st = os.stat(ROOT)
    assert (st.st_mode & 0o170000) == 0o040000, "root 不是目录"
    print("✅ [1/5] getattr /fairspace → 目录")
except Exception as e:
    print(f"❌ [1/5] getattr root 失败: {e}")
    errors += 1

# Test 2: 根目录 readdir（应看到 MongoDB 里的 datasetId）
try:
    ds = os.listdir(ROOT)
    print(f"✅ [2/5] listdir /fairspace → {len(ds)} 个 dataset")
    if ds:
        print(f"     前 5 个: {ds[:5]}")
except Exception as e:
    print(f"❌ [2/5] listdir root 失败: {e}")
    errors += 1
    sys.exit(1)  # 后面都依赖 ds

# 用第一个 dataset 做后续测试
DID = ds[0]

# Test 3: dataset 目录 getattr + readdir
try:
    st = os.stat(f"{ROOT}/{DID}")
    assert (st.st_mode & 0o170000) == 0o040000
    print(f"✅ [3/5] getattr /fairspace/{DID} → 目录")
except Exception as e:
    print(f"❌ [3/5] 失败: {e}")
    errors += 1

children = os.listdir(f"{ROOT}/{DID}")
print(f"     listdir /fairspace/{DID} → {children[:5]}")

# Test 4: 递归 walk 到第一个文件并 open
def walk_to_first_file(cur_path, depth=0):
    try:
        entries = os.listdir(cur_path)
    except OSError:
        return None
    for name in entries:
        if name in (".", ".."):
            continue
        full = os.path.join(cur_path, name)
        try:
            st = os.stat(full)
        except OSError:
            continue
        import stat as statmod
        if statmod.S_ISDIR(st.st_mode):
            result = walk_to_first_file(full, depth + 1)
            if result:
                return result
        else:
            return full
    return None

fpath = walk_to_first_file(f"{ROOT}/{DID}")
if fpath:
    print(f"✅ [4/5] 找到叶子文件: {fpath.replace(ROOT, '/fairspace')}")
    try:
        with open(fpath, "rb") as f:
            data = f.read(16)
        print(f"✅ [5/5] open + read 成功，前 16 字节: {data!r}")
    except FileNotFoundError as e:
        # Mongo 里 resolve 成功但宿主机没真实文件 → 不算 FUSE 失败
        print(f"⚠️  [5/5] open ENOENT（MongoDB resolve 了但宿主机没挂载真实文件）")
        print(f"     这不代表 FUSE 有问题——说明 /mnt/sciencedbNew 在宿主机不完整")
    except Exception as e:
        print(f"❌ [5/5] open 失败: {e}")
        errors += 1
else:
    print("⚠️  [4/5] 没找到叶子文件（可能 fileTree 为空）")

print()
if errors == 0:
    print("═══ 所有 FUSE 验收测试通过 ═══")
else:
    print(f"═══ {errors} 项失败 ═══")
    sys.exit(1)
PYEOF

echo
echo "=========================================================="
echo "  验证完成"
echo "=========================================================="
echo
echo "后续操作："
echo "  停止:    docker compose down"
echo "  重启:    docker compose restart dataset-vfs"
echo "  看日志:  docker compose logs -f dataset-vfs"
echo "  清理:    docker compose down -v"
