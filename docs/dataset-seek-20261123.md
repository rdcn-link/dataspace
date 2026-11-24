# Dataset exploration and catalog ranking fix (2026-11-23)

Validated in the test environment, then deployed to https://conox.cn/. Chemistry and TPDC keep their respective HTTPS exploration origins. The gateway resolves exact external IDs and source paths from the existing TDS dataCenter.json configuration instead of inventing /mnt/data/{id}. The mapping endpoint is private (public404), and browser requests cannot select paths or user IDs.

Ranking reads existing tds.analysis-tool-statistics feedback for exploration tools registered in tds-analysis-tool. Counts join on center and exact dataset name, preserving version distinctions; unrelated operator calls are excluded. Higher counts precede existing recommendation/selected sort keys. Aggregates have a30-second memory cache. No new counter collections, callback records, metadata writes or database indexes were introduced.

Chemistry metadata6a8ebb9f73770000bd007f82 passed real submission200 and HTTPS exploration page200, without starting scientific analysis. Nine catalog and fifteen gateway regression tests passed. Both portals passed ranking(17,6,3,2), pagination, detail consistency, anonymous401 and private mapping404 checks. Real screenshots were reviewed. Production catalog response improved from approximately18seconds to1.54seconds using existing indexes and sorting the small positive candidate set in memory.

TPDC remains unaccepted: its configured CMFD v2.0(1951-2024) path /mnt/TPDC/phase_02/dataFile/e60dfd96-5fd8-493f-beae-e8e5d24dece4 was rejected with400, source directory missing on the Docker host. The center must confirm its mount/path. Existing catalog versions(1979-2018 and solar1983-2017) were not rebound to a different version. Unconfigured resources are explicitly rejected.

Source and tests were synchronized to the local separated workspace and public-source checkout; no automatic Git commit/push. OIDC, TDS and4fair-web sources were not changed. Other centers' old origins remain unchanged. verification.json lists evidence and guarded backup paths. Restore gateway and catalog files together, remove newly added mapping/ranking modules if restoring the initial baseline, and restart services; do not overwrite later changes.

## Production revalidation passed (2026-11-23)

From the production backend, both configured datasets(CMFD v2.0,1951-2024; global solar radiation,1983-2018) returned200 for submission, exploration page and authenticated dataset API. The earlier internal-test directory failure does not establish a production failure; this production result is authoritative. No dataset versions were substituted and no scientific analysis was started. Local tpdc-validation-20261123/verification.json holds sanitized evidence.
