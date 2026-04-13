# How it works

The seeder library fills entity properties with generated data. You describe what data each property should hold (using `@Seed()` decorators on your entities), then call a seeding method. The library builds fully populated instances — including all related entities — in one call.

## The four seeding methods

All seeding flows through four methods on the `seed()` builder:

| Method | Quantity | What you get |
|--------|----------|--------------|
| `create()` | One | Built and returned directly — no database |
| `createMany(n)` | Many | Array built and returned directly — no database |
| `save()` | One | Written to the database, then returned |
| `saveMany(n)` | Many | Array written to the database, then returned |

All four methods read your `@Seed()` decorators and auto-seed relations. The difference is whether the result is persisted: `create` and `createMany` build and return entities directly; `save` and `saveMany` write to the database first, then return the persisted result.

## Mental model

Think of seeding in three steps:

**1. Describe** — annotate entity properties with `@Seed()`:

```ts
@Entity()
class Author {
  @Seed(() => faker.person.fullName())  // ← describe
  @Column()
  name!: string

  @Seed({ count: 3 })  // ← describe
  @OneToMany(() => Book, (b) => b.author)
  books!: Book[]
}
```

**2. Call** — pick a method and supply options:

```ts
const author = await seed(Author).create()                     // returned directly
const authors = await seed(Author).createMany(5)               // array returned directly
const author = await seed(Author).save({ dataSource })         // persisted, then returned
const authors = await seed(Author).saveMany(5, { dataSource }) // array persisted, then returned
```

**3. Use** — the returned instance(s) have all properties populated:

```ts
author.name      // "John Smith" (from @Seed factory)
author.books     // [Book, Book, Book] (seeded automatically)
author.id        // assigned by the database (only set after save)
```

Relations are seeded automatically — the library detects cycles and stops before infinite loops.

## Next steps

- [Decorating entities](/guide/decorating-entities) to learn `@Seed()` syntax in detail
- [Seeding entities](/guide/seeding-entities) for detailed options on each method (relations, values, etc.)
- [Seeder suites](/guide/seeder-suites) to organize multiple seeders with dependencies
