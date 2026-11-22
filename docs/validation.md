# Publication validation

[中文](validation_zh.md)

Date: 2026-11-22 (Asia/Shanghai). Checks ran against the isolated public-source snapshot, not live services.

- 138 JavaScript/Node source files across Conet web, catalog adapter and data robots: syntax checks passed.
- Frontend route, path-traversal and HTTP/API proxy checks: passed.
- Session gateway identity, roles, publication/download boundaries and user-center tests: 12/12 passed.
- Catalog/business adapter suite: 41/44 passed. Three existing service-design tests remain stale: one assumes every application has fixed datasets; two assume old seed/fire input defaults. Their current inputs are rejected by validation. These failures are retained and reported, not hidden or relabeled as passing. The operator-manifest fixture and scientific source manifest path were made self-contained for the checkout.
- Data robots: 4/4 passed.
- Gitleaks 8.30.1 source scan: no unresolved findings after credential cleanup. The committed .gitleaksignore contains only individually reviewed false positives (synthetic redaction test, PEM marker strings, a vendored parser symbol, an upstream checksum and dataset-binding IDs). No real credential is allowlisted. Known private deployment values were separately compared against public text.

JDK/Maven/sbt and a working Python scientific environment were unavailable locally; full Java/Scala builds and scientific re-execution were not performed. OIDC/TDS also reference odc-common-jdk21, whose source is absent here. Production node enrollment, real WeChat sign-in and a newly approved remote calculation are deployment acceptance work, not proven by this source publication.
