# Run once

By default (`runOnce: true`) each seeder is tracked in a `seeders` table — similar to how TypeORM tracks migrations. On the next boot — including watch-mode restarts — seeders already recorded in that table are skipped.

## In combination with `dropSchema`

When TypeORM's `dropSchema: true` is set, the entire schema — including the `seeders` table — is dropped on every start, so all seeders run regardless of `runOnce`.

| `dropSchema` | `runOnce` | What happens |
|---|---|---|
| `true` | `true` | Tracking table dropped → all seeders run (fresh schema needs fresh seeds) |
| `true` | `false` | Always runs |
| `false` | `true` | Tracking table persists → already-run seeders are skipped |
| `false` | `false` | Always runs (tracking disabled) |

`dropSchema: true` is typical in development when you want a clean slate on every restart — seeding every run is exactly what you want in that scenario. `runOnce: true` with a persistent schema is the right default for staging and production, where duplicate data is the concern.

## Evolving seed data

Treat seeders the way you treat migrations: once a seeder has run in a persistent environment, consider it immutable. If you need more data or different data, create a new seeder class rather than editing the existing one:

```ts
@Seeder()
class UserSeeder implements SeederInterface { ... }      // already ran, leave it alone

@Seeder({ dependencies: [UserSeeder] })
class UserSeederV2 implements SeederInterface { ... }   // adds more users on next boot
```

This keeps the history table accurate and avoids the question of what re-running a seeder would mean for data that already exists. This applies to environments where `dropSchema: false` and `runOnce: true` — in development with `dropSchema: true`, the schema is wiped on every restart anyway.

## Re-seeding

To force a seeder to run again, use `seed:untrack`:

::: code-group

```bash [npm]
npx @joakimbugge/typeorm-seeder seed:untrack UserSeeder -d ./dist/datasource.js
```

```bash [yarn]
yarn @joakimbugge/typeorm-seeder seed:untrack UserSeeder -d ./dist/datasource.js
```

```bash [pnpm]
pnpm exec @joakimbugge/typeorm-seeder seed:untrack UserSeeder -d ./dist/datasource.js
```

:::

Or delete its row directly from the `seeders` table:

```sql
DELETE FROM "seeders" WHERE name = 'UserSeeder';
```

To reset everything and re-run all seeders on next boot:

```sql
DELETE FROM "seeders";
```

::: info
If your factories use random data (e.g. via Faker), setting `runOnce: false` means you will get a completely different dataset on every restart. This can be useful in some development setups, but is usually not what you want.
:::
