# Dataspace · 科诺空间

[简体中文](README_zh.md)

Source snapshot of the scientific trusted data space: discover datasets, run reusable applications, coordinate data-center computation and publish consented analysis products.

## Source layout

| Directory | Responsibility |
|---|---|
| projects/conet-web | Current frontend, session/API gateway and user center |
| projects/conet-server | Scala application hosting and Node.js metadata/business adapter |
| projects/dacp | Distributed data access, node services and Union coordination |
| projects/xstream | Execution engine, workflow Designer, operator SDKs and examples |
| projects/oidc-server | Java identity/WeChat login backend |
| projects/tds-trading | Java dataset requests, approval and metadata business interfaces |
| projects/4fair-web | Related reference frontend; not the current public portal |
| projects/ai-dataseek | Dataset exploration service |
| projects/dataset-vfs, projects/s3-gateway | Related file-access services |
| projects/data-robots | Data robot management service |
| services | Scientific analysis operators, runners and source manifests |

## Start here

Read [deployment](docs/deployment.md), [configuration](docs/configuration.md), [publication scope](docs/source-scope.md), and [validation](docs/validation.md). Component READMEs contain build and protocol details. This repository is source code, not a database export or a ready-to-run production backup.

No production database URIs, model API keys, WeChat secrets, private keys, login rosters, database dumps, operator ZIP packages, raw scientific datasets or historical result stores are included. Public UI assets and explicitly synthetic development fixtures remain with their code. Supply protected runtime configuration separately.

Existing component and upstream license/copyright notices are retained. Public repository visibility does not replace component license terms; no new blanket license is asserted by this snapshot.
