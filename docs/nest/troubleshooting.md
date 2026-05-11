# Troubleshooting

## Common NestJS-specific issues

### Seeders running twice or not at all

**Problem:** Seeders run on every hot reload, or don't run on application bootstrap.

**Cause:** `run-once` tracking not enabled, or seeder modules not imported.

**Solutions:**

```ts
// runOnce: true is the default — seeders already in the history table are skipped
SeederModule.forRoot({ seeders: [UserSeeder, PostSeeder] })

// If runOnce is explicitly set to false, every boot re-runs all seeders
SeederModule.forRoot({ seeders: [UserSeeder, PostSeeder], runOnce: false }) // ← remove this

// If dropSchema: true is set on TypeORM, the history table is dropped every restart,
// so all seeders always run — this is usually intentional in development
```

If seeders are not running at all, confirm `SeederModule` is imported and that the `enabled` option (if set) evaluates to `true`.

---

## Still stuck?

- Check [Getting started](/nest/) for module setup
- See [Seed scripts](/nest/seed-scripts) for running seeders manually
- Review TypeORM [troubleshooting](/guide/troubleshooting) for non-NestJS issues
- Open an issue on [GitHub](https://github.com/joakimbugge/seeders/issues)
