# Analysis statistics

The user center has separate Data exploration and Application analysis tabs. Charts use the self-hosted Apache ECharts 5.6.0 common bundle; its original LICENSE and NOTICE are retained under `conet-web/public/vendor/`.

## Authorization

All requests require a verified gateway session. Platform-wide access requires the existing platform administrator flag, derived from the configured administrator UID list and verified OIDC role. A center administrator is identified by `tds-datacenter.adminUid`; center statistics are restricted to that administrator's registered sources. Switching to personal scope does not remove this center restriction. Ordinary users can access only their own records. Browser-supplied user IDs do not determine the authenticated actor.

`GET /api/metadata/platform/user-center/statistics` accepts `kind=exploration|applications`, `scope=all|center|self`, `center`, `user` (application user dimension), exact `tool`/`dataset` filters, `start`/`end` dates, `grain=day|week|month`, and `page`/`pageSize` (up to 100). Invalid or unauthorized scopes are rejected. Both charts and details use the same authorized and filtered record set. No new statistics records, indexes, or tables are created.

## Sources and counting

Exploration reads `tds.analysis-tool-statistics`. Specific `dataName` values are preferred; missing tool names are resolved through `tds-analysis-tool`, then the recorded tool name/ID. Dataset labels retain the existing `datasetTittle` field spelling. Unknown names are explicitly labeled, never invented. Unclassified source labels are kept separate from registered center counts.

Applications read persisted `conet.tasks` with execution records. Centers come from recorded resource snapshots, approval center IDs, and metadata center associations in `resource_bindings`; simulated execution-node labels are not treated as data ownership. Missing ownership stays unassigned. The global task total is unique by task. A cross-center task contributes once to every participating center, so center participation totals may exceed the task total. User and center dimensions are independently filterable within permissions.

Time buckets use Asia/Shanghai; weeks start Monday. Missing intervals are filled with zero counts, not interpolated calls. Invalid dates are excluded from the timeline while retained in total counts. All-time is the default; custom date ranges are limited to one year. Rankings show the top ten; pie charts combine remaining categories into Others while retaining the correct total. Detail pages contain 20 records by default.

Charts are disposed and resized when tabs or layouts change. Rendering uses text labels and rich-text canvas tooltips. No authentication tokens or external chart CDN URLs are stored in the frontend. API statistics indicate recorded calls, not verified success of an external scientific operation.
