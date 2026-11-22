# Deployment guide

[中文](deployment_zh.md)

## Topology

The public frontend and the controller/backend may run on separate hosts. Data-center DACP services read local datasets and execute approved workflows. Raw data stays at its owner; analysis outputs are collected at the controller. Historical published products can be browsed without launching new computation.

Public ingress must forward APIs and protected results through the session gateway. Do not expose core/catalog/robot ports directly. Use projects/conet-web/nginx.conf.example as the simple same-host starting point; a split-host installation needs private upstream addresses, TLS, trusted proxy headers and firewall rules. Back up existing Nginx/service/database configuration before changes, validate it, then reload. Keep a release directory and a reversible current symlink.

## Build from source

1. Install Node.js 22+, JDK 17 and sbt 1.10.x for Scala, JDK 21/Maven for Java identity/business services, Python and Docker for analysis. Follow each component's pinned dependencies; related services are optional, not all are mandatory for a basic portal.
2. In projects/conet-web run npm run build and npm run check. The generated dist directory belongs in the frontend release directory (commonly /var/www/html/conet/releases/<release>); do not publish source/backend config as static files.
3. In projects/conet-server/catalog-adapter run npm ci, then configure external MONGO_URI, CONET_REGISTRY_MONGO_URI and TDS_TRADING_URL. Its start command is node server.mjs. See validation notes before running the entire historical test suite.
4. Build Scala core, DACP and XStream using their READMEs. DACP has multiple independently built subprojects; do not assume one root build.sbt. XStream's bootstrap publishes local artifacts before downstream builds. Stage the Conet core and Designer; run the web server.mjs as the identity gateway.
5. Build OIDC/TDS with mvn package after providing the odc-common-jdk21 dependency from its maintained distribution. This shared library is referenced but its source is not present in this checkout. Reuse existing compatible services when available. Never copy private Maven settings or credentials into Git.
6. Generate protected gateway, ownership, role and computation-approval configuration. Configure center administrators from verified identity records. Never automatically make the first user administrator; never treat a simulated approval as a formal decision.
7. Stage scientific sources under the runtime paths expected by runners (e.g. services/scientific-analysis to /mnt/data/conet/downloaded-validation). Supply operator registration, runtime images and approved dataset bindings independently. No historical run database or result bundle is shipped with source.

## Backend service responsibilities

| Service | Example private port | Role |
|---|---|---|
| Core | 28870 | Hosting/network access |
| Catalog adapter | 28871 | Metadata, application/task/product registry |
| Session gateway | 29588 | Authentication and guarded APIs |
| Union | 29860; status 29880 | Distributed coordination |
| Designer | 28840 | Workflow editing |
| Operator catalog | 28820 | Versioned operator discovery |
| Existing OIDC/TDS | 10004 / 10003 | Identity and business APIs |

These are illustrative controller ports, not hardcoded deployment requirements. Source defaults differ; set launch configuration consistently. Browser routes must never bypass identity checks.

## Data-center node

Install DACP, its XStream execution dependencies, approved scientific runtime images and local dataset publication configuration on the owning center. Register the node with Union, issue a scoped machine identity and trust certificates outside Git, and verify dataset ID/public ID/center mappings. The center administrator approves dataset computation; the application owner controls execution/publication. Collect all output artifacts and provenance at the controller in task-isolated directories. Public visibility requires explicit publication; anonymous downloads remain denied.

## Acceptance and rollback

Check health, catalog/detail/news, application ordering/previews, live login, role isolation, approval notification/decision, approved node-local execution, controller result collection, publication/revocation and authenticated downloads. An existing result page does not prove a new distributed task works. The production data-center enrollment and new execution still require site-specific acceptance. On failure restore the previous release/configuration; database changes need their own documented backup/restore plan.
