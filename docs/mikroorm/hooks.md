# Hooks

`runSeeders` accepts lifecycle callbacks that fire around each seeder:

```ts
await runSeeders([UserSeeder, PostSeeder], {
  em,
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
  em,
  skip: (seeder) => alreadyRun.has(seeder.name),
})
// UserSeeder is skipped, PostSeeder runs normally
```

Skipped seeders do not trigger `onBefore`, `onAfter`, or `onError`.
