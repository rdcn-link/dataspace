# ScienceDB exploration update (2026-11-23)

Submissions use https://scidb.fairspace.cn/api/v1/datasets/submissions and the user-confirmed /mnt/fairspace/{external_id} storage rule. Result pages use the same HTTPS origin. ScienceDB records require isAiExploration=1 (or legacy string1) in both UI and backend; login remains required. Other centers are unaffected. Metadata is read, not rewritten.

The original Nanopore Part16 record6b001a837ada270dc98e7f1d, external ID fba1de9f338c4b54b43761778931e107, passed real submission200 and result page200. All17 gateway-related tests passed; public ranking, anonymous401, private mapping404 and metadata flag output were verified. No exploration statistics were added; existing center feedback remains authoritative.

The test host cannot reach the new origin on443. Code/UI policy were verified in test; real submission was verified in an isolated module on the production backend before deployment. Both environments and the production frontend are updated, with cache versioning and guarded backups. Local/public-source copies are synchronized, without automatic Git commit/push. Local scidb-seek-20261123/verification.json records evidence/backups. TPDC mount availability remains a separate unresolved issue.

## User acceptance update (2026-11-23)

The user confirmed successful real ScienceDB access from the production backend. The internal test network at90.48 differs from the data center public-access/callback network. This is a documented environment limitation, explicitly excluded from remediation and from this integration acceptance requirements. Production availability is the acceptance basis; equivalent external reachability from90.48 is not required.
