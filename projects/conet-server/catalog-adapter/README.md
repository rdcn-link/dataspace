# Metadata and application backend

Node.js 22 (`mongodb` 6.22.0) serves the separated frontend at `127.0.0.1:8871`. `MONGO_URI` reads published metadata from `tds`; `CONET_REGISTRY_MONGO_URI` writes the separate `conet` business database. The process never changes identity/role records. Protected connection values remain outside the web bundle and delivery archives. `TDS_TRADING_URL` defaults to `http://127.0.0.1:10013`.

Metadata list/detail/search and registered-center descriptions remain read-only. Center names use `data_center_name` and `org_name`. Registration does not prove a compute connection. The unified business API is `/api/metadata/platform`; see [registry contract and acceptance](../../../platform-registry/README.md) for collections, revisions, task idempotency, resource identities, four independent node states, checksums and deployment boundaries.

`services.json` is the immutable versioned release source for 60 platform designs. A changed definition requires a changed version. MongoDB is the canonical business registration for platform designs, verified applications and user contributions. Designed applications without an installed, verified method must remain clearly unverified. User applications use the existing App Builder compiler and Union runtime; their original definition and workflow are frozen per run. Simulation runs and old job drafts are retired, not alternate task stores.

`application-plugins.mjs` discovers local `application-plugins/*.mjs`. Each plugin exports a unique `serviceId`, `registryAdapter: {handle, artifacts}` and a validation capability. Domain handlers implement `/template`, `/sources`, `/runs`, `/cases`, `/cases/{id}/prefill`, `/runs/{id}` and explicitly allowlisted artifact names. These are internal plugin contracts; public clients use unified `/applications/{id}/tasks` routes. The registry maps task/artifact storage to canonical Mongo records, without embedding format branches in shared code. Plugins own validation, queueing, scientific execution, cancellation/restart semantics and their result schema. An interrupted run must not be silently resumed or marked successful.

Frontend modules use a local `applicationClient` URL `/application-plugins/<name>.js`; external module URLs are rejected. `loadDetail(service,host,context)` uses the existing navigation/style and common rendering helpers. It must separate the reusable application from concrete cases, offer a button/dialog for task configuration, retain history and identify unavailable resources/methods.

NPP and precipitation retain their existing domain plugins and original real records. The downloaded-data plugin family uses configuration in `/mnt/data/conet/downloaded-validation/applications.json`, independent run directories under `/mnt/data/conet/catalog-integration/scientific-runs/{application}/{uuid}`, and immutable `conet_downloaded_analysis` operators. Sources have full-file SHA256 checks; the owning node performs `read_item` and analysis via DACP/Union. Explicit `bin` byte publication delegates physical-format interpretation to the domain operator rather than guessing a records schema or expanding containers during generic discovery. Domain limits still apply. Current task policies use 900 seconds within existing Union limits; client deadlines do not expand the server allowance.

Scientific results expose tables/figures, source and parameter snapshots, job/status evidence and downloads. Table-preview applications intentionally return selected table contents; production centers must explicitly authorize that output scope. Format profiling is only acceptance of a format-inspection application, never acceptance of a different scientific method. Origin OPJ analysis remains unavailable until a verified parser recovers its numerical axes, samples and units.

Current user controls are paused for engineering validation as requested. Data-center restrictions are allowed by user authorization for this test, with `formalApproval:false`; this is not formal center approval. Restore ownership, release/download controls and actual center agreements before public production use.

Verification and domain boundaries: [downloaded dataset applications](../../../service-design/downloaded-validation/README.md). Source metadata is not modified by preparation, and archives are never executed as code. Per-task outputs may not overwrite another task. Tests: `node --test platform-contracts.test.mjs`, real-input direct checks, DACP execution/numerical/parameter/rejection checks and browser checks. Evidence is under `/mnt/data/conet/tool-audit/platform-registry/` and `/mnt/data/conet/tool-audit/downloaded-validation/`.

## Current user-center and consent controls (2026-11-18)

The earlier engineering-validation description is superseded when `computationApprovalsEnabled` is active: new analyses use real authenticated identity and dataset computation approval; result publication remains explicit. The user center scopes private lists and personal statistics to the verified UID, reuses TDS dataset business and keeps computation/download approval records separate. Application ratings, favorites, audit and robot state use dedicated `conet` collections. See [user-center interfaces, deployment and verification](../../../user-center/README.md), and [application presentation](../../../application-refinement/README.md). Private catalog/robot APIs must never bypass the session gateway at public ingress.

## Product registration (2026-11-18)

`product-registry.mjs` adds `conet.products` and `conet.product_events`, indexes explicit task publication into fixed snapshots, and bridges genuine hosted products. Public previews, authenticated/policy-limited downloads, creator withdrawal and personal management share the same registry. Binary storage remains with the existing result adapters; SHA256 is checked. This is not automatic DACP hosting. See [contract and evidence](../../../products-integration/README.md).

## Node management

`node-management.mjs` links all original TDS centers to dedicated `conet.node_profiles` and `node_events`; original center/approval records remain unchanged. A sanitized public directory is separate from administrator-only maintenance. Monitoring uses real remote DACP/Union observations, with explicitly tagged 82.136 examples until a center is bound to its own discovered member. See [interfaces and verification](../../../node-management/README.md).

## Exact dataset detail lookup

Fixed the route variable shadowing that caused detail503. Exact record IDs and published-status guards remain enforced. See [regression and live checks](../../../catalog-detail-fix/README.md).

## Unified catalog listing

Published source records and explicitly published products share category-aware pagination through catalog-list.mjs. See [contract and verification](../../../catalog-layout/README.md).

## Additional real-data applications and category counts

Fifteen applications and runtime dataset adapters were verified on82.136; outputs remain private by user decision. Category counts include published resources only. See [batch acceptance](../../../dataset-batch-20261118/README.md) and [counts](../../../catalog-counts/README.md).

## App Builder usage and ordering

Statistics use persisted observed execution events instead of planned operator references. Application display order is administrator-maintained in MongoDB sortOrder, with verified featured applications first. See [counting contracts, ordering and acceptance](../../../appbuilder-refinement/README.md).

