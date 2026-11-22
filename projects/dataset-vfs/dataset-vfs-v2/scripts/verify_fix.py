import sys; sys.path.insert(0, '.')
from app.resolver import PathResolver

r = PathResolver('/fairspace')

print("=== Case B: fusepy-native paths (no virtual_root prefix) ===")
for p in ["/", "/ds1", "/ds1/V1", "/ds1/V1/file.HDF"]:
    pp = r.parse(p)
    print(f"  {p:30s} → role={pp.role.value:12s} ds={pp.dataset_id!r:32s} segs={pp.segments}")

print()
print("=== Case A: user-facing paths (with /fairspace prefix) ===")
for p in ["/fairspace", "/fairspace/ds1", "/fairspace/ds1/V1", "/fairspace/ds1/V1/file.HDF"]:
    pp = r.parse(p)
    print(f"  {p:40s} → role={pp.role.value:12s} ds={pp.dataset_id!r:32s} segs={pp.segments}")
