# Seeding entities

Call `seed(EntityClass)` to get a builder with four methods: `create`, `createMany`, `save`, and `saveMany`.

```ts
import { seed } from '@joakimbugge/typeorm-seeder'
```

## Saving

`save()` and `saveMany()` create instances and write them to the database in one step. Pass a `DataSource` in the options.

```ts
const author = await seed(Author).save({ dataSource })
// author.id  → assigned by the database
// author.books → 3 persisted Book instances

const authors = await seed(Author).saveMany(5, { dataSource })
// [Author, Author, Author, Author, Author] — each with their own books
```

## Without saving

`create()` and `createMany()` build entity instances without touching the database. Useful for unit tests or for preparing entities before passing them to your own persistence logic.

```ts
const author = await seed(Author).create()
// Plain Author instance — no id, fully populated relations

const books = await seed(Book).createMany(10)
// [Book, Book, …] — each with its own seeded Author
```

## Multiple entity types at once

Pass an array of entity classes to seed one of each:

```ts
const [author, book] = await seed([Author, Book]).create()
const [author, book] = await seed([Author, Book]).save({ dataSource })
```

Relation seeding is **disabled by default** in this form — each entity is created independently, so there is no overlap between the `Author` you asked for and the `Author` that would have been auto-created inside `Book`. Pass `relations: true` to override:

```ts
const [author, book] = await seed([Author, Book]).save({ dataSource, relations: true })
// author.books → seeded  |  book.author → seeded (independently)
```

`createMany` and `saveMany` return an array per class:

```ts
const [authors, books] = await seed([Author, Book]).createMany(3)
// authors → [Author, Author, Author]
// books   → [Book, Book, Book]
```

## Skipping relations

Pass `relations: false` to create a flat entity with no relation properties set — useful when you want to wire relations yourself:

```ts
const author = await seed(Author).create({ relations: false })
// author.books → undefined

const book = await seed(Book).save({ dataSource, relations: false })
// book.author → null in the database
```

## Passing a DataSource to factories

If a factory needs to query the database, the `dataSource` you provide in options is forwarded to every factory via `SeedContext`:

```ts
@Seed(async ({ dataSource }) => {
  const existing = await dataSource!.getRepository(Role).findOneBy({ name: 'admin' })
  return existing!
})
@ManyToOne(() => Role)
role!: Role
```

::: tip
For anything more complex than a simple lookup — such as picking a random element from a result set — prefer the [`values` option](#overriding-seeded-values) instead. It keeps that logic in the call site rather than the entity decorator.
:::

## Overriding seeded values

Pass a `values` map to inject specific values after all `@Seed` factories have run:

```ts
// Status is set even if Booking has no @Seed on it
const booking = await seed(Booking).create({ values: { status: 'confirmed' } })
const booking = await seed(Booking).save({ dataSource, values: { user, status: 'confirmed' } })

// All 5 get the same user
const bookings = await seed(Booking).createMany(5, { values: { user } })
const bookings = await seed(Booking).saveMany(5, { dataSource, values: { user } })
```

Each property in `values` can also be a factory function — it is called once per entity, so every instance can receive a unique generated value:

```ts
const bookings = await seed(Booking).saveMany(10, {
  dataSource,
  values: {
    price: () => faker.number.float({ min: 10, max: 500 }), // unique per booking
    status: 'confirmed',                                     // same for all
  },
})
```

Factory entries in `values` receive the same `(context, self, index)` arguments as `@Seed` factories, so you can read already-applied properties from `self`, query the database via `context.dataSource`, or use the [sequence index](/guide/decorating-entities#using-the-sequence-index) to generate unique values per entity.

`values` wins unconditionally: if a property has a `@Seed` factory, the factory still runs but its result is overwritten. `values` also works for properties with no `@Seed` decorator at all.

::: info
`values` are applied **after** all `@Seed` factories have finished, so they are never visible on `self` inside a `@Seed` factory callback.
:::

## Depending on earlier properties

Properties are seeded in declaration order. Each factory receives the partially-built entity as its second argument (`self`), so a property can read any value that was seeded above it:

```ts
@Entity()
class Event {
  @Seed(() => faker.date.past())
  @Column()
  beginDate!: Date

  @Seed((_, self: Event) => faker.date.future({ refDate: self.beginDate }))
  @Column()
  endDate!: Date
}
```

Annotating `self` with the entity class (`self: Event` above) gives full type inference and autocompletion. Without the annotation `self` is typed as `any`, so property access still works — the annotation is only needed for type safety.

Properties declared *below* the current property are not yet set and will be `undefined` on `self` at that point.

## Depending on earlier instances in a batch

When using `createMany` or `saveMany`, each factory receives a `previous` map on the context. `ctx.previous.get(EntityClass)` returns a snapshot of all instances of that type created so far in the current batch — so instance `i` sees instances `0..i-1`:

```ts
@Entity()
class Booking {
  @Seed((ctx) => {
    const last = (ctx.previous?.get(Booking) as Booking[] | undefined)?.at(-1)
    return last ? last.to.plus({ days: 1 }) : DateTime.now()
  })
  @Column()
  from!: DateTime

  @Seed((_, self: Booking) => self.from.plus({ days: faker.number.int({ min: 2, max: 14 }) }))
  @Column()
  to!: DateTime
}

const bookings = await seed(Booking).createMany(5)
// bookings[0].from → now
// bookings[1].from → bookings[0].to + 1 day
// bookings[2].from → bookings[1].to + 1 day  … and so on
```

`previous` is a `Map` keyed by entity class, so when a child entity is created as part of a relation it can also read the parent's batch:

```ts
@Entity()
class Comment {
  @Seed((ctx) => {
    // How many Posts have already been created in this batch?
    const posts = ctx.previous?.get(Post) as Post[] | undefined
    return posts?.at(-1)?.id ?? null
  })
  @Column({ nullable: true })
  latestPostId!: number | null
}
```

Each `createMany` call starts with an empty entry for the type being batched, so Books created for `Author[0]` and Books created for `Author[1]` each see only their own siblings — never each other's.

::: tip Running a seed script?
See [Running scripts](/guide/running-scripts) for how to execute seed code directly with Node.js or ts-node, including the `reflect-metadata` import requirement and TypeScript execution options.
:::
