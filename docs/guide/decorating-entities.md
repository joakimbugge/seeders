# Decorating entities

Use `@Seed()` on any entity property to describe how it should be populated. Plain column properties (scalars) take a factory function; relation properties take the bare decorator (or a `count` option for collections).

```ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm'
import { faker } from '@faker-js/faker'
import { Seed } from '@joakimbugge/typeorm-seeder'

@Entity()
class Author {
  @PrimaryGeneratedColumn()
  id!: number

  @Seed(() => faker.person.fullName())
  @Column()
  name!: string

  @Seed({ count: 3 })
  @OneToMany(() => Book, (b) => b.author)
  books!: Book[]
}

@Entity()
class Book {
  @PrimaryGeneratedColumn()
  id!: number

  @Seed(() => faker.lorem.words(4))
  @Column()
  title!: string

  @Seed()
  @ManyToOne(() => Author, (a) => a.books)
  author!: Author
}
```

::: warning Circular relations
When seeding `Author`, its `books` are seeded too. Each `Book` has an `author` relation back to `Author` — but seeding that would loop back to `Author`, which would seed more books, and so on forever.

`@joakimbugge/typeorm-seeder` breaks the cycle at the point where a type would re-enter itself. In the example above, `book.author` is left `undefined` when seeding from `Author`. Seeding a `Book` directly works fine and does populate `book.author` — the cycle only cuts when a type is already being seeded higher up in the same chain.
:::
