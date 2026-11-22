"""Unit tests for tree_walker.py using a copy of the real MongoDB
document provided by the user.

Run directly:
    python scripts/test_tree_walker.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.tree_walker import walk_children, resolve_path, tree_to_plain  # noqa: E402

# ── Exact copy of the user-provided sample fileTree ──────────────────
SAMPLE_FILETREE = {
    "V1": [
        {
            "SADR_submission": [
                {
                    "calibration_202405": [
                        {
                            "algorithm_detection_202405．csv": "/mnt/sciencedbNew/dataSet/79d/621/292/e569922327b4543823272d0/50450.csv"
                        },
                        {
                            "goes_xray_202405_1min．txt": "/mnt/sciencedbNew/dataSet/bfa/34e/d2d/b57208ae7b057fa91777707/2487650.txt"
                        },
                        {
                            "swpc_flare_list_202405．csv": "/mnt/sciencedbNew/dataSet/cf0/74b/b55/77e4c23f27d40c83978e5fc/28460.csv"
                        }
                    ]
                },
                {
                    "test_2025": [
                        {
                            "algorithm_detection_2025_full．csv": "/mnt/sciencedbNew/dataSet/ce8/d11/29c/e2459b85c362c7aa9a4a54d/401799.csv"
                        },
                        {
                            "goes_xray_2025_full_1min．txt": "/mnt/sciencedbNew/dataSet/f2b/40e/27a/efdf0cf5e1bc7daf188c723/28787931.txt"
                        },
                        {
                            "summary_monthly_metrics．csv": "/mnt/sciencedbNew/dataSet/8a2/4dc/abd/0362da458e8cbe1cbb196e6/1762.csv"
                        },
                        {
                            "summary_overall_metrics．csv": "/mnt/sciencedbNew/dataSet/4fe/70e/7d7/c0996a41a3e5893820605a7/274.csv"
                        },
                        {
                            "swpc_flare_list_2025_full．csv": "/mnt/sciencedbNew/dataSet/5da/156/4a0/aa5ecc697866afe3ca612f7/111464.csv"
                        }
                    ]
                },
                {
                    "数据说明．txt": "/mnt/sciencedbNew/dataSet/1d3/b96/667/515e6e15f534fd41ec3b446/6067.txt"
                }
            ]
        }
    ]
}


def test_walk_top_level() -> None:
    """walk_children(fileTree, []) → ['V1']"""
    children = walk_children(SAMPLE_FILETREE, [])
    assert children == ["V1"], children
    print("  ✅ top-level children =", children)


def test_walk_v1() -> None:
    """walk_children(fileTree, ['V1']) → ['SADR_submission']"""
    children = walk_children(SAMPLE_FILETREE, ["V1"])
    assert children == ["SADR_submission"], children
    print("  ✅ ['V1'] children =", children)


def test_walk_sadr() -> None:
    """walk_children(fileTree, ['V1', 'SADR_submission']) → three entries:
    calibration_202405 (dir), test_2025 (dir), 数据说明．txt (file)"""
    children = walk_children(SAMPLE_FILETREE, ["V1", "SADR_submission"])
    assert "calibration_202405" in children
    assert "test_2025" in children
    # 数据说明．txt → filename (full-width dot, exact match)
    assert "数据说明．txt" in children, children
    assert len(children) == 3, children
    print("  ✅ ['V1','SADR_submission'] children =", children)


def test_walk_calibration() -> None:
    """walk_children(fileTree, ['V1','SADR_submission','calibration_202405']) → 3 files"""
    children = walk_children(SAMPLE_FILETREE, ["V1", "SADR_submission", "calibration_202405"])
    assert "algorithm_detection_202405．csv" in children
    assert "goes_xray_202405_1min．txt" in children
    assert "swpc_flare_list_202405．csv" in children
    assert len(children) == 3, children
    print("  ✅ calibration_202405 children =", children)


def test_resolve_leaf() -> None:
    """resolve_path → real path string"""
    real = resolve_path(
        SAMPLE_FILETREE,
        ["V1", "SADR_submission", "calibration_202405", "goes_xray_202405_1min．txt"],
    )
    assert real == (
        "/mnt/sciencedbNew/dataSet/bfa/34e/d2d/"
        "b57208ae7b057fa91777707/2487650.txt"
    ), real
    print("  ✅ resolve leaf →", real)


def test_resolve_data_desc() -> None:
    """resolve_path on 数据说明．txt which sits directly under SADR_submission
    (not nested further)."""
    real = resolve_path(
        SAMPLE_FILETREE,
        ["V1", "SADR_submission", "数据说明．txt"],
    )
    assert real.endswith("6067.txt"), real
    print("  ✅ resolve 数据说明．txt →", real)


def test_resolve_not_found() -> None:
    """missing leaf → FileNotFoundError"""
    try:
        resolve_path(SAMPLE_FILETREE, ["V1", "SADR_submission", "does_not_exist.csv"])
    except FileNotFoundError:
        print("  ✅ missing leaf raises FileNotFoundError")
        return
    raise AssertionError("expected FileNotFoundError")


def test_flatten() -> None:
    flat = tree_to_plain(SAMPLE_FILETREE)
    print("  flatten produced", len(flat), "entries")
    assert len(flat) == 3 + 5 + 1  # calibration:3, test_2025:5, 数据说明:1
    # One known path
    key = "V1/SADR_submission/test_2025/swpc_flare_list_2025_full．csv"
    assert key in flat, f"{key!r} missing from flat"
    print("  ✅ flatten OK, sample:", flat[key])


if __name__ == "__main__":
    tests = [
        test_walk_top_level,
        test_walk_v1,
        test_walk_sadr,
        test_walk_calibration,
        test_resolve_leaf,
        test_resolve_data_desc,
        test_resolve_not_found,
        test_flatten,
    ]
    passed = 0
    for t in tests:
        print(f"• {t.__name__}")
        try:
            t()
            passed += 1
        except AssertionError as e:
            print(f"  ❌ FAIL: {e}")
        except Exception as e:
            print(f"  ❌ EXC: {e!r}")
    print()
    print(f"══════ {passed}/{len(tests)} passed ══════")
    sys.exit(0 if passed == len(tests) else 1)
