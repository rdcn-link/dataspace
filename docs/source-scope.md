# Source snapshot scope

[中文](source-scope_zh.md)

Snapshot date: 2026-11-22 (Asia/Shanghai). Current Conet sources come from the separated local frontend/backend workspace; DACP/XStream come from maintained local platform-source checkouts. OIDC, TDS, AI-DataSeek, dataset-vfs and S3 services come from related backend workspaces; 4fair-web is included as a reference frontend. Scientific sources come from service-design, including the later batch analysis implementation.

This is a fresh history: upstream/local .git histories and operational investigation folders are excluded. Original component notices remain. Public UI image assets are retained; scientific result stores, original datasets, DB exports, screenshots of acceptance sessions, deployment backups, account lists and private connection files are excluded. One-off DB-seeding/manual maintenance test files are excluded because they contained operational identities/credentials.

Publication-only changes: externalize Java Mongo/WeChat configuration; replace example credentials/tokens; make the scientific manifest location portable; move the operator test manifest into a source fixture; add docs and ignore rules. Running production/test services were not changed by this publication. Existing runtime paths/defaults are documented rather than claiming a universal one-command installer.
