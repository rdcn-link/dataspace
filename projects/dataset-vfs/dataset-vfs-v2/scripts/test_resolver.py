"""Unit tests for the PathResolver (pure string ops, no DB needed).

Run directly:
    python scripts/test_resolver.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.models import PathRole
from app.resolver import PathResolver  # noqa: E402


def run() -> int:
    r = PathResolver("/fairspace")

    cases = [
        # (path, expected_role, expected_dataset_id_or_None, expected_segments)
        ("/fairspace",                                   PathRole.ROOT,         None,                              []),
        ("/fairspace/",                                  PathRole.ROOT,         None,                              []),
        ("/fairspace/36dc46db5ad44037a8a68fa51e8aad11", PathRole.DATASET_DIR,  "36dc46db5ad44037a8a68fa51e8aad11", []),
        # 任意深度嵌套
        ("/fairspace/36dc46db5ad44037a8a68fa51e8aad11/V1",
                                                        PathRole.DEEP,         "36dc46db5ad44037a8a68fa51e8aad11", ["V1"]),
        ("/fairspace/36dc46db5ad44037a8a68fa51e8aad11/V1/DataSample",
                                                        PathRole.DEEP,         "36dc46db5ad44037a8a68fa51e8aad11", ["V1","DataSample"]),
        ("/fairspace/36dc46db5ad44037a8a68fa51e8aad11/V1/DataSample/file.HDF",
                                                        PathRole.DEEP,         "36dc46db5ad44037a8a68fa51e8aad11", ["V1","DataSample","file.HDF"]),
        # 尾部有斜杠 → 不应该改变 role
        ("/fairspace/ds1/V1/",                           PathRole.DEEP,         "ds1",                             ["V1"]),
        # 路径在虚拟根外
        ("/other/path",                                  PathRole.ROOT,         None,                              []),
        ("/tmp",                                         PathRole.ROOT,         None,                              []),
    ]

    passed = 0
    for path, exp_role, exp_ds, exp_segs in cases:
        p = r.parse(path)
        ok = (
            p.role is exp_role
            and p.dataset_id == exp_ds
            and p.segments == exp_segs
        )
        mark = "✅" if ok else "❌"
        print(f"{mark} {path}")
        if not ok:
            print(f"   got  role={p.role}  ds={p.dataset_id!r}  segs={p.segments}")
            print(f"   want role={exp_role}  ds={exp_ds!r}  segs={exp_segs}")
        else:
            passed += 1

    print(f"\n═══ {passed}/{len(cases)} passed ═══")
    return 0 if passed == len(cases) else 1


if __name__ == "__main__":
    sys.exit(run())
