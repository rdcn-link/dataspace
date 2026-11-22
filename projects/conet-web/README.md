# CONET / 科诺空间 frontend

The public header brand is CONET | 科诺空间. CONET stays in the header and 科诺空间 is its Chinese subtitle. Industry trusted data space remains the product positioning in explanatory copy. Page titles and application/result attribution continue to use 科诺空间.

## Refinement, 2026-11-18

The homepage describes authorized analysis across data centers, from discovering data and running applications to sharing results. Its UNION illustration now shows short names and domains of five centers verified against the current catalog: Qinghai-Tibet Plateau, Science Data Bank, Kunming Institute of Zoology, chemistry/chemical engineering and basic disciplines. Each card links to the source-filtered catalog, with full names in accessible labels/tooltips. Connections are illustrative, not assertions of production connectivity or computation approval. The editorial labels reflect a verified catalog snapshot, not live network status.

Existing navigation, including the data-robot entry, and business interactions are preserved. Authentication, approvals, tasks, publication rules and scientific result files are unchanged.

## Local development and repository preparation

- Maintain `public/`; generate `dist/` with `npm run build`. Source files were reconciled with the actual 90.48 release before editing to preserve current production fixes.
- `server.mjs` and `backend/` contain the site's proxy and session gateway. Credentials/configuration remain outside the source tree.
- `npm run check` validates routes/proxy behavior; `npm run build` produces deployable assets.
- Deployment checks individual SHA256 baselines, saves backups and updates both source/build directories without restarting analysis services.
- Commit source, build scripts and documentation. Exclude runtime configuration, database connection strings, session keys, audit backups, `node_modules/` and analysis output directories.

The workspace `brand-refinement/` holds the change manifest, deployment baseline, browser evidence and source-package checksums. A remote repository will only be created or pushed after its location is supplied.

## Dynamic center directory

The homepage no longer hardcodes five centers. `/api/metadata/hub-showcase` reads MongoDB registration counts and full names flagged `isAccess:1`. Four peripheral nodes rotate one at a time every two seconds and refresh the directory every 30 seconds, with pause/hover/reduced-motion support. Actual data has 30 registered and five flagged centers. The 30-eligible-center scalability scenario was verified only in isolated browser fixtures, without changing database flags.

Current status (2026-11-18): per user feedback, the homepage restores the prior fixed five-center illustration and no longer loads the rotation script. The header remains CONET | 科诺空间. Dynamic-showcase details above describe the now-inactive trial.

All four homepage counters read `/api/metadata/platform/homepage-metrics`: onboarded centers, original datasets plus published analysis products, real-data-verified applications and persistent analysis runs. The existing separate MongoDB `conet.tasks` collection is reused with 30-second refreshes, without webpage constants or in-memory increments. Historical cases do not automatically count as published products.

## User center and application presentation (2026-11-18)

The homepage now features six selected real-data applications. Cards display persistent analysis counts and login-only ratings. Details show the latest public successful result, introduction and expandable history. Selection and ratings persist in MongoDB; see [application presentation](../../application-refinement/README.md).

Authenticated users enter `/user-center/` from the header. Personal profile, favorites, reviews, analysis statistics/history and request/approval tabs retain the site's visual system. Existing dataset business reuses TDS; new application favorites/audit and robot state persist in `conet` MongoDB collections. Robots have moved to administrator-only user-center routes and loopback service binding. All public ingress must use the session gateway, including metadata routes. See [user-center contracts and evidence](../../user-center/README.md). No real account modifications or WeChat notifications are claimed by browser fixtures.

## Unified data products (2026-11-18)

The `/products/` directory now reads the MongoDB product registry through the session gateway. Explicit consent is required; historical successful cases are not automatically published. The existing detail shell supports canonical task snapshots and hosted products, with permission-aware downloads and creator withdrawal. My data products and administrator-only product-development robot entry are in user center. See [interfaces, verification and current boundaries](../../products-integration/README.md).

## Dedicated card artwork (2026-11-18)

Homepage/application/product cards use separately versioned SVG theme covers selected by `card-covers.js`; original scientific images remain unchanged in detail and result previews. Cover assets live in `assets/application-covers/v1` and `product-covers/v1`; new application IDs use themed fallbacks without inventing analytical results. See [design, scientific integrity checks and browser evidence](../../card-cover-refinement/README.md).

## Publication form wording (2026-11-18)

Product publication provides generated names/source attribution, editable presets and custom wording; explicit download/publication consent remains unchecked. The selected final text uses the existing persistence contract. The application-service engineering notice has been removed. See [behavior and verification](../../publication-form/README.md).

## Node directory and administrator maintenance (2026-11-18)

`/nodes/` shows center information and explicit example metrics from the actual 82.136 DACP runtime. Technical connection/read/verification states move to administrator-only `/user-center/?section=nodes`, with 30 original centers, editable Mongo-backed profiles and real runtime binding. See [contracts, monitoring semantics and evidence](../../node-management/README.md).

## Dataset detail browsing (2026-11-18)

Dataset detail links open in a new tab, preserving catalog state. Exact published-record detail lookup repaired; see [verification](../../catalog-detail-fix/README.md).

## Catalog categories (2026-11-18)

The catalog now groups All, Source datasets and Analysis products, without a summary strip or news entry. See [behavior and checks](../../catalog-layout/README.md).

## November19 catalog counts and private analysis results

Category buttons display live published counts. Fifteen additional real-data application pages retain the existing style and protected task results. See [counts](../../catalog-counts/README.md) and [validation](../../dataset-batch-20261118/README.md).
