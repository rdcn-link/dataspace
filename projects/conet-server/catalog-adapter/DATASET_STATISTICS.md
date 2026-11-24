# Dataset usage statistics

Source dataset cards and detail pages show favorites, views, and downloads, in that order.

Favorites are counted from `tds.tds-favorite`. Downloads are read from the existing `tds.tds-dataset.downloadCount`, maintained by the existing TDS download flow (`order/dataset.addDownloadCount`). Submitting an application or opening exploration does not count as a download. External downloads require their existing callback/reporting to update the TDS counter.

Views combine the existing metadata view count with the persistent increment stored in `conet.dataset_statistics`. Its `_id` is the exact metadata ID; `viewCount` contains only new Conet views. The catalog metadata connection remains read-only. Historical metadata counters are not copied, overwritten, or incremented again.

`POST /api/metadata/platform/datasets/{metadataId}/views` accepts an empty JSON object. The server verifies that the exact dataset version is published, then atomically increments its business counter. Anonymous browsing is allowed; existing gateway same-origin checks apply. Clients cannot supply a counter, user ID, or update other fields. Ordinary GET/HEAD metadata reads do not count views.

The browser counts each dataset once per page lifecycle. Favorite/comment refreshes reuse this count. A new page load counts a new view. This is page-view counting, not unique visitor counting. Popularity sorting by the original metadata view field has not been changed by this update.
