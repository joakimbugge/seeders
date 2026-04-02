# TODO

Items identified from documentation review. Ordered roughly by impact.

---

## ~~Factory sequence index~~ ✓ done

~~Factory functions currently receive `(context, instance)`. They have no access to a sequence number, making it impossible to produce unique sequential values like `user-${i}@example.com` without external mutable state.~~

`SeedFactory` now receives `index: number` as its third argument. Counts from 0 across `createMany`/`saveMany` batches; always `0` for single `create`/`save` calls. Applies to both `@Seed` factories and `values` map factories.

---

## ~~`seed:list` CLI command~~ ✓ done

`seed:list` queries the history table and prints `name` + `executed_at` for all tracked runs via `console.table`. Handles missing table and empty table gracefully.

---

## ~~Parallel seeder execution~~ ✓ done

~~`runSeeders` executes seeders sequentially even when multiple seeders at the same topological level have no dependency on each other.~~

`topoSort` replaced with `buildLevels`, which groups nodes by depth (`level = max(dep levels) + 1`). `runSeeders` iterates levels sequentially but runs each level's seeders with `Promise.all`.

---

## ~~MikroORM `defineEntity` support~~ ✓ done

`defineEntity()` is not compatible with `@Seed()`. The pure schema-first form has no class to decorate. The hybrid form (`defineEntity({ class: MyClass, ... })`) has a class but MikroORM does not run `@Entity()` on it, so `PATH_SYMBOL` is never set and `getMikroOrmProperties()` returns empty — `@Seed()` is not picked up. Documented as a limitation: the decorator-based approach is the only supported style.

---

## ~~MikroORM tree entities~~ ✓ done

MikroORM v7 does not have tree entity support at the ORM level. Not applicable.

---

## ~~`--dry-run` CLI flag~~ ✓ done

Both `seed:run` and `seed:entities` now accept `--dry-run` / `-n`. `seed:entities` creates entities in memory and prints them with `util.inspect`; `seed:run` prints the list of seeders that would execute. No database connection is established in either case.

---

## Chunked persistence for `saveMany`

`saveMany(N)` persists all entities in a single operation. For large N this can cause memory pressure and oversized transactions. A `chunkSize` option would split the work into batches.

Affects all four packages.

---

## Dynamic `count` in `@Seed`

`@Seed({ count: 3 })` accepts only a static number. A factory function would allow the count to vary based on context:

```ts
@Seed({ count: (ctx) => ctx.relations ? 3 : 0 })
@OneToMany(() => Book, b => b.author)
books!: Book[]
```

Affects all four packages.
