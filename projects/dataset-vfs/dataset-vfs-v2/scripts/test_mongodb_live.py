"""Live integration test – connects to the real MongoDB server.

Run:
    PYTHONPATH="vendor;." python scripts/test_mongodb_live.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "vendor"))

from app.config import Settings
from app.api_client import MetadataClient


def main() -> int:
    s = Settings.from_env()
    print(
        f"mongo:  {s.MONGO_URI.split('@')[-1].split('?')[0]}",
        f"db={s.MONGO_DB}  coll={s.MONGO_COLLECTION}",
    )

    with MetadataClient(s) as c:
        # 1. list datasets
        ds = c.list_datasets()
        print(f"\n📚 list_datasets → {len(ds)} entries")
        for d in ds[:5]:
            print(f"   dataset_id={d.dataset_id}")
        if len(ds) > 5:
            print(f"   ... and {len(ds)-5} more")

        if not ds:
            print("ERROR: no datasets found")
            return 1

        did = ds[0].dataset_id
        # 2. list children at dataset root
        children = c.list_children(did, [])
        print(f"\n📁 [{did}] children at root → {len(children)} entries")
        for ch in children[:8]:
            mark = "📄" if not ch.is_dir else "📁"
            print(f"   {mark} {ch.name}")
        if len(children) > 8:
            print(f"   ... and {len(children)-8} more")

        # 3. Walk to first leaf and resolve
        def walk_find_file(cur_segs):
            for ch in c.list_children(did, cur_segs):
                if not ch.is_dir:
                    try:
                        return c.resolve(did, cur_segs + [ch.name])
                    except FileNotFoundError:
                        continue
            for ch in c.list_children(did, cur_segs):
                if ch.is_dir:
                    r = walk_find_file(cur_segs + [ch.name])
                    if r:
                        return r
            return None

        resolved = walk_find_file([])
        if resolved:
            print(f"\n✅ resolve success")
            print(f"   virtual = {resolved.virtual_path}")
            print(f"   real    = {resolved.real_path}")
            print(f"   exists locally? = {os.path.exists(resolved.real_path)}")
        else:
            print("\n⚠️  no leaf file found to resolve (tree may be empty)")
            return 1

    print("\n🎉 Real MongoDB integration OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
