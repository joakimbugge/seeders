# Tree entities

All four of TypeORM's tree strategies work with `@Seed`: `adjacency-list`, `materialized-path`, `closure-table`, and `nested-set`. Annotate `@TreeParent` with `@Seed()` to seed a parent node, and `@TreeChildren` with `@Seed({ count: N })` to seed children.

```ts
@Entity()
@Tree('materialized-path')
class Category {
  @PrimaryGeneratedColumn()
  id!: number

  @Seed(() => faker.commerce.department())
  @Column()
  name!: string

  @Seed()
  @TreeParent()
  parent?: Category

  @Seed({ count: 2 })
  @TreeChildren()
  children!: Category[]
}

const category = await seed(Category).create()
// category.parent   → one Category, no further parent
// category.children → [Category, Category], no further children

const category = await seed(Category).save({ dataSource })
// Persisted and assigned an id
```

For `save()` and `saveMany()` the seeder detects tree entities automatically and persists nodes in the correct order for each strategy: the parent first so it has a DB-assigned ID or path, then the root, then the children. No extra configuration is needed.

::: warning Tree depth is limited to one level
The same circular guard that prevents infinite loops on regular relations applies here. When seeding a `Category`, the parent's own parent is not seeded (because `Category` is already in the ancestor chain at that point), and each child's own children are not seeded either.

The result is always a flat three-node snapshot: parent → root → [child₁, child₂, …]. Deep or arbitrarily shaped trees cannot be produced by auto-seeding alone — use a `@Seeder` to build those manually with the TypeORM tree repository API.
:::

::: info Seeded entities always have a parent when `@TreeParent` is annotated with `@Seed()`
The seeded entity is never a DB tree root in this case — it always has a parent node. To produce a root, skip the parent at call time:

```ts
// No relations at all
const root = await seed(Category).save({ dataSource, relations: false })

// Relations seeded, but parent overridden to undefined
const root = await seed(Category).save({ dataSource, values: { parent: undefined } })
```

To attach to an existing node in the tree, use `values` in the same way:

```ts
const existing = await dataSource.getTreeRepository(Category).findOneByOrFail({ name: 'Electronics' })
const child = await seed(Category).save({ dataSource, values: { parent: existing } })
```
:::
