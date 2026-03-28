# API reference

## `@Seed(factory?, options?)`

Property decorator. Marks a property for automatic seeding.

| Signature | Behaviour |
|---|---|
| `@Seed(factory)` | Calls `factory(context, self)` and assigns the result |
| `@Seed(factory, options)` | Same, with additional options |
| `@Seed(options)` | Relation seed with options (e.g. `count`) |
| `@Seed()` | Bare relation seed — auto-creates one related entity |

**`SeedFactory<T, TEntity>`**

```ts
type SeedFactory<T = unknown, TEntity = any> = (context: SeedContext, self: TEntity) => T | Promise<T>
```

`self` is the entity instance as it exists when the factory runs — properties declared above this one are already populated, properties below are `undefined`. Annotate `self` with the entity class to get type inference:

```ts
@Seed((_, self: MyEntity) => ...)
```

**`SeedOptions`**

| Property | Type | Description |
|---|---|---|
| `count` | `number` | Number of related entities to create. Only applies to `one-to-many` and `many-to-many` relations. |

---

## `seed(EntityClass)`

Returns a builder for creating and persisting seed entities.

```ts
seed(Author).create(context?): Promise<Author>
seed(Author).createMany(count, context?): Promise<Author[]>
seed(Author).save(options): Promise<Author>
seed(Author).saveMany(count, options): Promise<Author[]>
```

The array form returns a tuple of instances (or arrays of instances for `createMany`/`saveMany`):

```ts
seed([Author, Book]).create(context?): Promise<[Author, Book]>
seed([Author, Book]).createMany(count, context?): Promise<[Author[], Book[]]>
seed([Author, Book]).save(options): Promise<[Author, Book]>
seed([Author, Book]).saveMany(count, options): Promise<[Author[], Book[]]>
```

**`CreateOptions<T>`** — passed to `create()` and `createMany()` on the single-class form

| Property | Type | Description |
|---|---|---|
| `dataSource` | `DataSource?` | Forwarded to factory functions via `SeedContext`. |
| `relations` | `boolean?` | Set to `false` to skip relation seeding. Defaults to `true`. |
| `values` | `SeedValues<T>?` | Property values applied after all `@Seed` factories have run. Each entry can be a static value or a factory called once per entity. Wins unconditionally — `@Seed` factories still execute but their output is overwritten. Also works for properties with no `@Seed` decorator. |

**`SaveOptions<T>`** — passed to `save()` and `saveMany()` on the single-class form

| Property | Type | Description |
|---|---|---|
| `dataSource` | `DataSource` | Required. Active TypeORM data source used to persist entities. |
| `relations` | `boolean?` | Set to `false` to skip relation seeding. Defaults to `true`. |
| `values` | `SeedValues<T>?` | Property values applied after seeding and before persisting. Each entry can be a static value or a factory called once per entity. Wins unconditionally — `@Seed` factories still execute but their output is overwritten. Also works for properties with no `@Seed` decorator. |

---

## `loadEntities(sources)`

Resolves a mixed array of entity constructors and glob patterns to a flat array of constructors.

```ts
loadEntities(sources: (EntityConstructor | string)[]): Promise<EntityConstructor[]>
```

String entries are treated as glob patterns, expanded to file paths, and dynamically imported. Every exported class constructor found in the matched modules is collected. Constructor entries pass through unchanged.

---

## `loadSeeders(sources)`

Resolves a mixed array of seeder constructors and glob patterns to a flat array of seeder constructors.

```ts
loadSeeders(sources: (SeederCtor | string)[]): Promise<SeederCtor[]>
```

Behaves identically to `loadEntities` except that only constructors decorated with `@Seeder` are collected — other exports in matched files are ignored. Constructor entries pass through unchanged.

---

## `@Seeder(options?)`

Class decorator. Registers a class as a seeder and declares its dependencies.

**`SeederOptions`**

| Property | Type | Description |
|---|---|---|
| `dependencies` | `SeederInterface[]` | Seeders that must run before this one. |

---

## `runSeeders(seeders, options?)`

Topologically sorts and runs the given seeders plus all their transitive dependencies.

```ts
runSeeders([PostSeeder], { dataSource }): Promise<void>
```

Throws if a circular dependency is detected.

**`RunSeedersOptions`** extends `SeedContext`

| Property | Type | Default | Description |
|---|---|---|---|
| `dataSource` | `DataSource?` | — | Passed through to each seeder's `run()` and to factory functions. |
| `relations` | `boolean?` | `true` | Passed through to each seeder's `run()`. |
| `logging` | `boolean?` | `true` | Log seeder progress. Set to `false` when handling output via hooks. |
| `onBefore` | `(seeder) => void \| Promise<void>` | — | Called before each seeder runs. |
| `onAfter` | `(seeder, durationMs) => void \| Promise<void>` | — | Called after each seeder completes successfully. |
| `onError` | `(seeder, error) => void \| Promise<void>` | — | Called when a seeder throws. The error is re-thrown after this returns. |
| `skip` | `(seeder) => boolean \| Promise<boolean>` | — | Return `true` to skip a seeder. Skipped seeders bypass all hooks. |

---

## `SeedContext`

Passed to factory functions and `SeederInterface.run()`.

| Property | Type | Description |
|---|---|---|
| `dataSource` | `DataSource?` | Active TypeORM data source. |
| `relations` | `boolean?` | Set to `false` to skip relation seeding. Defaults to `true`. |
