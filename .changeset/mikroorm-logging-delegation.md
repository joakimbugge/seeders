---
"@joakimbugge/mikroorm-seeder": minor
"@joakimbugge/nest-mikroorm-seeder": patch
"@joakimbugge/nest-typeorm-seeder": patch
"@joakimbugge/typeorm-seeder": patch
---

**`@joakimbugge/mikroorm-seeder`:** `runSeeders` now accepts `logging: 'mikroorm'` to delegate seeder progress output through MikroORM's own logger (`em.config.getLogger()`). Whether output is shown depends on MikroORM's `debug` configuration — the seeder passes messages through and MikroORM decides. Silently no-ops when no `em` is provided.

**All packages:** Updated repository URLs, homepage, and bug tracker links following the repository rename from `to-seeder` to `seeders`. Updated documentation links in package READMEs to point to the correct API reference paths.
