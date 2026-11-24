# News reading pages and dataset references

News cards continue opening the hosted article in a new tab. The public news API adds cover URLs and associations derived only from explicit CSTR references in `tds-information.cstr`. Matching published `tds-dataset` records provide links to their exact metadata IDs. Unresolved identifiers remain exact catalog-search links; title similarity or center ownership is not used to invent dataset associations. The article sidebar also preserves data-service links explicitly present in the article.

Generate compatible cached WeChat articles with Node.js 22 and the build-only Cheerio dependency:

```sh
npm ci
npm run build:news -- --input /tmp/news-originals --metadata /tmp/news-metadata.json --output /tmp/news-generated
```

Metadata is an array of public fields: `_id`, `name`, `description`, `source`, `url`, `coverUrl`, `cstr`, `updateAt`. Do not supply account records, credentials, or messaging-service identifiers. The generator emits HTML, a guarded deployment manifest, and preservation reports. Article payloads and deployment inventories are operational content, not source-code files to commit.

Generated pages use `/news-reader.css`, `/news-reader.js`, site navigation, and the existing website style setting. Typography, section navigation, image zoom, article attribution, and mobile layouts are shared. Text and image source order are compared against the original body before generation succeeds. Original image assets are not redrawn. Cached video references become explicit original-video links. The manifest contains original file hashes, allowing deployment to stop if another change has occurred.

The hosting web server must serve `/datasetFile/` from the existing document root. Some archived pages live in nested directories; map their public article-folder prefixes to the actual archived directories so relative images/styles remain resolvable. Do not flatten directories or silently generate replacement article bodies. A metadata-only summary fallback, if needed for missing future content, is visibly labeled as a summary. No summary fallback was needed for the 199 pages in the November 2026 rollout.

The user center uses Workbench for personal business overview, Analysis statistics for analytical charts, and grouped menus for Personal information, Analysis and results, Requests and approvals, and Platform administration. The existing capability checks still determine which menus appear; naming and grouping do not grant permissions.
