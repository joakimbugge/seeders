# TODO

## Logging strategy in SeederRunnerService

Currently `SeederRunnerService` uses NestJS's `Logger` for all seeder output (`[SeederRunnerService]` prefix). The underlying `runSeeders` call sets `logging: false`, so TypeORM-based logging from `typeorm-seeder` is bypassed entirely.

This raises a design question: should logging belong to NestJS, TypeORM, or be user-configurable?

**Arguments for keeping NestJS logging (current behaviour):**
- Consistent with the rest of a NestJS application — same format, same transport, same log levels.
- NestJS `Logger` is already injected and familiar to NestJS users.
- TypeORM logging feels out of place in a NestJS context.

**Arguments for TypeORM logging:**
- TypeORM logging is already wired in `typeorm-seeder` and respects the DataSource `logging` config.
- Users who want quiet production logs can disable seeder output through the TypeORM config they already have.

**Possible approach — a `logging` option:**

```ts
SeederModule.forRoot({
  seeders: [UserSeeder],
  logging: 'nest',     // 'nest' | 'typeorm' | 'console' | false
})
```

- `'nest'` (default) — current behaviour, uses NestJS `Logger`
- `'typeorm'` — delegates to `runSeeders` with `logging: true` and a DataSource, routing through TypeORM's logger
- `'console'` — plain `console.log`, useful outside a full NestJS context
- `false` — silent, user handles output via hooks

This would also mean exposing `logging` in `SeederModuleOptions` and threading it through to `runSeeders`.
