# Configuration

[中文](configuration_zh.md)

Keep real values outside Git. Limit configuration-file access to service accounts; never place credentials under the frontend document root.

- Metadata adapter: MONGO_URI reads the existing tds metadata; CONET_REGISTRY_MONGO_URI writes the dedicated conet business database. Provision separate least-privilege identities. TDS_TRADING_URL selects the existing business API. CONET_COMPUTE_CONFIG points to center-computation approval configuration; CONET_NETWORK_CONFIG points to the protected network connection file.
- Web gateway: CONET_ACCESS_CONFIG points to access.json; CONET_SERVER_URL and CONET_CATALOG_URL select private upstreams. publicOrigin must be the public HTTPS origin. keyFile references a generated 32-byte hex cookie-sealing key. registryFile references protected ownership/publication state. Admin UIDs, account-role mapping and any temporary login exceptions are deployment data, never source constants.
- OIDC and TDS: MONGO_URI is mandatory. OIDC also requires SSO_JWT_SECRET (at least 32 bytes; match consumers) and the WECHAT_* variables used by WeChatConfig.java. Configure official-account, mini-program and OAuth identifiers/secrets independently. Secrets have no source-code fallback. Application properties now refer to environment variables; previous hardcoded Mongo/WeChat values are removed only in this publication snapshot, without changing running servers.
- AI services: copy .env.example to an external .env, fill model/storage keys, and review the component's authentication boundary before public exposure. Related exploration components contain standalone defaults; they are not a substitute for the portal gateway.
- Paths: some legacy scientific runners still default to /mnt/data/conet. Use a deployment layout that supplies those paths or adapt configuration explicitly. CONET_ANALYSIS_SOURCE_DIRECTORY overrides the generic scientific manifest directory; the source snapshot defaults to services/scientific-analysis.

All example secrets are empty/placeholders. localhost database addresses in examples are illustrative and are not a connection to production. Never paste real credentials into tracked docs. Runtime tokens/certificates are still required for DACP machine authentication, independently of browser user roles.
