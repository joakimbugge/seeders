# Logging & hooks

## Logging

By default `runSeeders` logs each seeder's progress:

```
[UserSeeder] Starting...
[UserSeeder] Done in 42ms
```

When a seeder throws, a warning is logged before the error is re-thrown:

```
[UserSeeder] Failed after 3ms
```

Logging is routed through **TypeORM's own logger** when a `dataSource` is provided, so seeder output respects the same `logging` configuration as the rest of your TypeORM setup. To see seeder output, ensure your DataSource has `logging: true`, `logging: 'all'`, or `logging: ['log']`. Falls back to `console` when no `dataSource` is available.

Pass `logging: false` to silence all built-in output regardless of TypeORM's configuration.

## Hooks

`runSeeders` accepts lifecycle callbacks that fire around each seeder:

```ts
await runSeeders([UserSeeder, PostSeeder], {
  dataSource,
  onBefore: (seeder) => console.log(`Starting ${seeder.name}...`),
  onAfter: (seeder, durationMs) => console.log(`${seeder.name} done in ${durationMs}ms`),
  onError: (seeder, error) => console.error(`${seeder.name} failed`, error),
})
```

| Callback | When it fires |
|---|---|
| `onBefore(seeder)` | Before each seeder runs |
| `onAfter(seeder, durationMs)` | After each seeder completes successfully |
| `onError(seeder, error)` | When a seeder throws — the error is still re-thrown after this returns |

## Skipping seeders

Pass a `skip` callback to conditionally bypass individual seeders. Return `true` to skip, `false` (or nothing) to run:

```ts
const alreadyRun = new Set(['UserSeeder'])

await runSeeders([UserSeeder, PostSeeder], {
  dataSource,
  skip: (seeder) => alreadyRun.has(seeder.name),
})
// UserSeeder is skipped, PostSeeder runs normally
```

Skipped seeders do not trigger `onBefore`, `onAfter`, or `onError`.
