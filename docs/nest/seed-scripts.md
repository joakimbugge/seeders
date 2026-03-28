# Seed scripts

For simple cases where named, tracked seeders are more structure than you need, provide a `run` callback instead. It receives the resolved `DataSource` and executes on every boot — no run-once tracking applies:

```ts
SeederModule.forRoot({
  async run({ dataSource }) {
    await seed(User).saveMany(10, { dataSource })
  },
})
```

`run` is the escape hatch for seeding that should always happen. If you need run-once semantics, the named `@Seeder` pattern is the right tool.

::: info
Because `run` always executes, `runOnce` is not accepted when `seeders` is omitted — TypeScript will reject it at compile time.
:::

## Using both together

`seeders` and `run` can coexist. Seeders run first (sorted, tracked per their `runOnce` setting), then `run` is called. This means the callback can safely assume seeder data is already in place:

```ts
SeederModule.forRoot({
  seeders: [UserSeeder],
  async run({ dataSource }) {
    // UserSeeder has already run
    await seed(AdminUser).save({ dataSource })
  },
})
```

`runOnce` applies only to `seeders` — `run` always executes regardless.
