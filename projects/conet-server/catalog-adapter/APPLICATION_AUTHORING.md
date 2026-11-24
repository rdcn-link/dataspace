# Application authoring

Applications use the existing `conet.applications` and immutable `application_versions` collections. Drafts are private to their creator and platform administrators. Either may edit a never-published draft; publishing freezes its content permanently, including after withdrawal. Create a new application or copy for changes. Status changes do not rewrite scientific history, products or approvals.

Authenticated APIs under `/api/metadata/platform`:

| Endpoint | Purpose |
| --- | --- |
| `POST /application-drafts` | Save application/job YAML and expected revision |
| `GET /applications/:id/authoring` | Definition, revision and server permissions |
| `POST /applications/:id/copy` | Create an independently owned draft |
| `GET /applications/:id/package` | Export a `.conetapp.zip` |
| `POST /application-packages/import` | Import as a new private draft |
| `POST /applications` | Validate and publish once |
| `POST /applications/:id/discard` | Remove a draft using its expected revision |

Conflicting saves return 409. Published content writes return 403. Draft lists and version routes enforce the same visibility. Legacy App Builder save/package routes go through this policy. Templates, approvals, task history, verification status and results are never inherited as permissions or scientific proof by copies. Publication uses the existing compiled runtime, without submitting a scientific job.

Platform adapters can expose `registryAdapter.authoringTemplate()` returning `{job,evidence}`. The scientific file adapter uses the same `read_item → configured analysis operator` graph as its execution runner, with runtime data URI/filename bindings and configurable method defaults. Other platform definitions use existing platform workflow evidence when available. Planned designs remain empty drafts with their input contract and parameter guidance; missing workflows are not invented. Node placements, embedded private configurations and fixed entity paths are replaced by required runtime inputs.

Package format `conet-application` version 2 includes `manifest.json`, `application.yaml`, `job.yaml`, and optional uploaded PNG/JPG cover/background. Version 1 definitions are accepted, also as new drafts. Package size is at most 4 MiB; each YAML/manifest is at most 256 KiB; each image is at most 2 MiB. Import validates central-directory bounds, duplicates, paths and decompression limits before extraction; credentials are rejected. No datasets, code, tokens, task results or access approvals are packaged. Referenced built-in assets and HTTPS images remain references; uploaded images are bundled and revalidated by the existing image-upload API on import.

The web gateway offers `/api/appbuilder/designer/`, a restricted proxy to the configured real XStream Designer. It allows document editing, operator metadata and export, but rejects inference, previews and computation. The served Designer script disables automatic inference and the model chat configuration for this authoring surface only. The script marker is checked and an incompatible upstream version fails closed. Window handoff checks origin, source, random channel and application generation. Existing standalone Designer deployment is unchanged; its access must continue to follow the deployment's own controls.

The catalog uses `CONET_SERVER_URL` for its core connection. The access configuration may specify `designerBackendURL` (production: `http://127.0.0.1:28840/`) so server-to-server Designer requests do not loop through the public login endpoint or forward browser credentials. Initial node/task refresh runs in the background: Mongo-backed existing records remain available while remote metadata connections warm up. Publishing and refresh share one in-flight compilation per application/version; retrying an identical publication is a no-op, while altered published content is rejected.

The browser returns modified Job YAML to the application draft; the user saves it explicitly. Newly added variables and scientific output decoders must be configured before publication. A valid graph or a copied verified application is not evidence that the new application has passed scientific validation. Existing contributed-application computation approval is not yet generalized: this change does not enable new scientific runs or bypass center approval. Binary result operators still need their corresponding result handling; a generic JSON result declaration is not a verified binary-result renderer.

Tests: `node --test application-authoring.test.mjs`. End-to-end checks cover NPP copy/edit/return/save/reload, package import/export, anonymous isolation, conflicting saves and immutable published versions without starting scientific jobs. Deployment must preserve environment-specific core ports (8870 on test, 28870 on the current production controller), back up files, and compare previous SHA-256 values before installation.
