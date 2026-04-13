# Troubleshooting

## Common issues

### Relations are undefined

**Problem:** `author.books` or `book.author` is `undefined` after seeding.

**Cause:** Relations are disabled, or circular guard prevented seeding.

**Solutions:**

```ts
// 1. Enable relations if they're off (when seeding multiple types)
const [author, book] = await seed([Author, Book]).create({ relations: true })

// 2. For circular references, inject the relation manually
const author = await seed(Author).create()
const books = await seed(Book).createMany(3, { values: { author } })

// 3. Check circular guards — parent's parent won't be seeded
// See [Circular relations](/guide/decorating-entities#circular-relations)
```

---

### Factory context is undefined

**Problem:** `context.dataSource` or `context.previous` is `undefined` inside a `@Seed()` factory.

**Cause:** Context is only available when called from `seed()` with proper options, or when spreading `ctx` into nested options.

**Solutions:**

```ts
// 1. Pass dataSource when calling seed()
const author = await seed(Author).create({ dataSource })

// 2. When using seeder suites, spread ctx into options
@Seeder()
class AuthorSeeder implements SeederInterface {
  async run(ctx: SeederRunContext) {
    // Spread ctx so nested factories receive context
    return await seed(Author).createMany(5, ctx)
  }
}

// 3. For values option, factories also receive context
await seed(Author).create({
  dataSource,
  values: {
    role: async (ctx) => {
      const existing = await ctx.dataSource!.getRepository(Role).findOneBy({ name: 'admin' })
      return existing!
    }
  }
})
```

---

### Test runs pollute each other's data

**Problem:** Seeds from one test appear in another test's database.

**Cause:** Tests share a `DataSource`/`EntityManager` without isolation, or seeding happens in a shared beforeEach hook.

**Solutions:**

```ts
// 1. Use create() instead of save() for unit tests (no database)
const author = await seed(Author).create()
expect(author.name).toBeDefined()

// 2. For integration tests, wrap each test in a transaction
describe('Author', () => {
  let queryRunner: QueryRunner

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner()
    await queryRunner.startTransaction()
  })

  afterEach(async () => {
    await queryRunner.rollbackTransaction()
    await queryRunner.release()
  })

  it('seeded data is isolated', async () => {
    const author = await seed(Author).save({ dataSource: queryRunner.connection })
    expect(author.id).toBeDefined()
  })
})
```

---

### Relations not seeding in multi-type seed()

**Problem:** When calling `seed([Author, Book]).create()`, `book.author` is `null` but it should be seeded.

**Cause:** Relation seeding is **disabled by default** for multi-type calls — each entity is created independently.

**Solution:**

```ts
// Enable relations
const [author, book] = await seed([Author, Book]).create({ relations: true })
// Now book.author is seeded, but it's independent of the author returned
```

---

### Tree entities don't persist correctly

**Problem:** `save()` on a tree entity fails or the parent/child relationship is lost.

**Cause:** Tree strategy requires specific persistence order — parent before children.

**Solution:** The library handles this automatically. Ensure:

```ts
// 1. TreeParent and TreeChildren are decorated with @Seed()
@Entity()
@Tree('materialized-path')
class Category {
  @Seed()
  @TreeParent()
  parent?: Category

  @Seed({ count: 2 })
  @TreeChildren()
  children!: Category[]
}

// 2. Use save(), not create(), for trees (requires DB assignment)
const category = await seed(Category).save({ dataSource })
// Parent saved first, then children, automatically

// 3. Depth is limited to one level (circular guard applies)
// See [Tree entities](/guide/advanced-patterns/tree-entities)
```

---

### Index out of range in batch operations

**Problem:** Accessing `ctx.previous.get(Entity)` throws or returns empty array.

**Cause:** Batch hasn't started yet, or entity type not in previous map.

**Solution:**

```ts
@Seed((ctx) => {
  // Check if batch exists and is not empty
  const batch = ctx.previous?.get(Booking) as Booking[] | undefined
  return batch && batch.length > 0 ? batch[batch.length - 1].to : new Date()
})
@Column()
from!: Date

// Or use optional chaining safely
const last = (ctx.previous?.get(Booking) as Booking[] | undefined)?.at(-1)
```

---

## Still stuck?

- Check [Decorating entities](/guide/decorating-entities) for detailed factory patterns
- See [Seeding entities](/guide/seeding-entities) for `create()`, `save()`, and `values` option details
- Open an issue on [GitHub](https://github.com/joakimbugge/seeders/issues)
