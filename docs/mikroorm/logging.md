# Logging

`runSeeders` is silent by default (`logging: false`). Pass `logging` to opt into output:

```
[UserSeeder] Starting...
[UserSeeder] Done in 42ms
[UserSeeder] Failed after 3ms   ← logged at warn level
```

## `logging: true` — console logger

Routes output through `ConsoleLogger`, which wraps the global `console`. Progress messages use `console.log`; failures use `console.warn`.

```ts
await runSeeders([UserSeeder], { em, logging: true })
```

Supply a custom logger via the `logger` option — any object implementing `SeederLogger` works:

```ts
await runSeeders([UserSeeder], {
  em,
  logging: true,
  logger: {
    log: (msg) => myLogger.info(msg),
    warn: (msg) => myLogger.warn(msg),
    info: () => {},
    error: () => {},
    debug: () => {},
  },
})
```
