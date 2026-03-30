# Decorating entities

Use `@Seed()` on any entity property to describe how it should be populated. Plain column properties (scalars) take a factory function; relation properties take the bare decorator (or a `count` option for collections).

```ts
import { Entity, PrimaryKey, Property, OneToMany, ManyToOne } from '@mikro-orm/decorators/legacy'
import { faker } from '@faker-js/faker'
import { Seed } from '@joakimbugge/mikroorm-seeder'

@Entity()
class Author {
  @PrimaryKey()
  id!: number

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string

  @Seed({ count: 3 })
  @OneToMany(() => Book, (b) => b.author)
  books!: Book[]
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number

  @Seed(() => faker.lorem.words(4))
  @Property()
  title!: string

  @Seed()
  @ManyToOne(() => Author)
  author!: Author
}
```

::: warning Circular relations
When seeding `Author`, its `books` are seeded too. Each `Book` has an `author` relation back to `Author` — but seeding that would loop back to `Author`, which would seed more books, and so on forever.

`mikroorm-seeder` breaks the cycle at the point where a type would re-enter itself. In the example above, `book.author` is left `undefined` when seeding from `Author`. Seeding a `Book` directly works fine and does populate `book.author` — the cycle only cuts when a type is already being seeded higher up in the same chain.
:::

## Embedded types

`@Embedded` properties are seeded automatically. Annotate the embedded class's properties with `@Seed()` just like a regular entity:

```ts
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'

@Embeddable()
class Address {
  @Seed(() => faker.location.streetAddress())
  @Property()
  street!: string

  @Seed(() => faker.location.city())
  @Property()
  city!: string
}

@Entity()
class User {
  @PrimaryKey()
  id!: number

  @Seed()
  @Embedded(() => Address)
  address!: Address
}
```

Calling `create(User)` builds a `User` with a fully populated `Address` instance on `user.address`.
