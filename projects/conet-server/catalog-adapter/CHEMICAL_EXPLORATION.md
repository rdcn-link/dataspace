# Chemical data-center exploration binding

Chemical submissions use `https://chemdc.fairspace.cn/api/v1/datasets/submissions`; their authenticated landing page is `https://chemdc.fairspace.cn/dataset/seek/{returned_id}`. These are different parts of the same workflow, not interchangeable endpoints.

Use the metadata's `external_id` as the resource identifier. The current imported MongoDB records store this business identifier in `datasetId` (for example `39f1871350684505903d8727626759dd`); the adapter maps that field to submission `external_id`. Never substitute MongoDB `_id`. An existing center configuration can resolve a legacy record only by a unique matching business identifier or title. It supplies an identifier, not an authoritative storage-directory override.

`chemicalSeekBinding` calculates the storage directory from metadata `updateAt`, interpreted in Asia/Shanghai:

| Update year | Directory |
| --- | --- |
| 2026 | `/mnt/instdb/resourcesFile2026/{external_id}` |
| 2025 | `/mnt/instdb/resourcesFile2025/{external_id}` |
| Other years | `/mnt/instdb/resourcesFile/{external_id}` |

Missing/invalid timestamps or noncanonical identifiers are rejected instead of guessing another year, path or dataset. The internal projection reads `external_id` and `path` without exposing server paths through public dataset metadata. TPDC continues to use its metadata `path`; the chemical year rule does not apply to other centers.

The bulk verification uses bounded concurrency, retries transient communication/server errors and rate limiting, and submits with the configured platform administrator's verified identity. It snapshots original metadata in a protected server directory before changing anything. Only `isAiExploration` is updated: successful submissions become1 and failures0, with compare-and-set checks on original identifiers, source, publication status, timestamp and availability flag. Original metadata timestamps, identifiers, entity paths and files are not rewritten.

The website consistently uses a native disabled button for zero flags, with the same tooltip/accessibility message “暂未开放智能探查服务” in lists and details. No click-toast variant remains. Backend zero-flag enforcement is unchanged. Failed records require correction and a fresh successful verification before reopening; directory submission does not mean a scientific application has run or gained computation approval.
