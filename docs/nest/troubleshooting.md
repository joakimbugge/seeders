# Troubleshooting

## Common NestJS-specific issues

### Seeders running twice or not at all

**Problem:** Seeders run on every hot reload, or don't run on application bootstrap.

**Cause:** `run-once` tracking not enabled, or seeder modules not imported.

**Solutions:**

```ts
// 1. Enable run-once tracking in SeederModule
@Module({})
export class AppModule {
  static register(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        SeederModule.register({
          // Seeders run once per application lifecycle, not per hot reload
          seeders: [UserSeeder, PostSeeder],
          runOnce: true,  // default: true
        }),
      ],
    }
  }
}

// 2. Ensure seeders are declared in the module dependency
@Seeder({ dependencies: [UserSeeder] })
class PostSeeder implements SeederInterface {
  // ...
}

// 3. Check application bootstrap order — seeds run during onApplicationBootstrap
// If your data setup depends on other modules, they must be initialized first
```

---

## Still stuck?

- Check [Getting started](/nest/) for module setup
- See [Seed scripts](/nest/seed-scripts) for running seeders manually
- Review TypeORM [troubleshooting](/guide/troubleshooting) for non-NestJS issues
- Open an issue on [GitHub](https://github.com/joakimbugge/seeders/issues)
