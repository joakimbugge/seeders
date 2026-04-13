# What is seeding?

Seeding is generating test data or fixture data programmatically. Instead of manually creating entities in SQL or database migrations, you write code that generates realistic data — with relations, embedded types, and complex object graphs — ready to use in tests or demo environments.

## Seeding vs. other approaches

| Approach | Use case | When to reach for it |
|---|---|---|
| **Seeding** | Generate reusable test data with relations | Unit tests, integration tests, CI fixtures, demo databases |
| **Factories** | Build one-off entities for a single test | When you need a custom entity per test case |
| **Migrations** | Set up schema and seed production data | Schema versions, initial production state |
| **Fixtures** | Static snapshots of data | Immutable reference datasets, performance-sensitive tests |

**Seeding is a factory with relations built in.** You write the data shape once on your entities; every test reuses it. Relations are seeded automatically, without boilerplate.

## Why decorator-based?

Most seeding libraries require a separate factory file per entity and manual orchestration:

```ts
// Traditional: entity + separate factory
const book = new Book()
book.title = faker.lorem.words(4)
book.author = new Author()
book.author.name = faker.person.fullName()
// ...more boilerplate
```

With `@Seed()` decorators, the shape lives on the entity itself:

```ts
@Entity()
class Book {
  @Seed(() => faker.lorem.words(4))
  @Column()
  title!: string

  @Seed()  // Author is seeded automatically
  @ManyToOne(() => Author)
  author!: Author
}

// One line. Relations, embedded types, circular guards all handled.
const book = await seed(Book).create()
```

## When to use seeding in your project

- **Unit tests**: Generate test data without a database
- **Integration tests**: Build realistic datasets, verify behavior across relations
- **CI fixtures**: Consistent test data across all test runs
- **Demo databases**: Pre-populate development environment with sample data
- **Documentation examples**: Show API endpoints with realistic payloads

## Next steps

- [How it works](/guide/how-it-works) for an overview of the four seeding methods
- [Decorating entities](/guide/decorating-entities) to learn the `@Seed()` decorator syntax
- [Seeder suites](/guide/seeder-suites) to organize complex seeding logic into reusable classes
