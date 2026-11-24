# User-center exploration statistics fix (2026-11-23)

The exploration statistics page defaulted to the last30days, excluding older feedback and showing0 despite valid history. The overview counted application tasks only. Statistics now default to all history, offer30-day/custom filters, and retain cumulative counts and latest timestamps alongside filtered results. Overview metrics separate application tasks from dataset exploration.

The existing analysis-tool-statistics collection remains read-only. All personal queries use the gateway-verified UID; query parameters cannot select another user. No statistics or identity mappings were inserted/changed. China-time boundaries validate actual calendar dates and retain the one-year limit for custom ranges.

Deployed to test and production. Read-only database reconciliation verified cumulative/range/overview consistency and user isolation; all20 related tests passed. Isolated browser fixtures validated all-time/recent/overview UI, without claiming real-user authentication. The frontend script is cache-versioned. Login/approval behavior is unchanged, with guarded pre-deployment backups.
