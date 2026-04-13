# Getting started

Decorator-based entity seeding for TypeORM. Built on [`@joakimbugge/seeder`](/seeder/) — the ORM-agnostic core. Annotate entity properties with `@Seed()`, then create or persist fully populated entity graphs with a single call — including relations, embedded types, and circular guards. Organize complex seeding scenarios into `@Seeder` classes with declared dependencies that are automatically ordered and executed.

## Installation

`typeorm` and `reflect-metadata` are peer dependencies.

::: code-group

```bash [npm]
npm install @joakimbugge/typeorm-seeder typeorm reflect-metadata
```

```bash [yarn]
yarn add @joakimbugge/typeorm-seeder typeorm reflect-metadata
```

```bash [pnpm]
pnpm add @joakimbugge/typeorm-seeder typeorm reflect-metadata
```

:::

Verify these compiler options are enabled in your `tsconfig.json` — TypeORM requires them and they should already be set:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Basic usage

Import entity decorators from `typeorm`, annotate properties with `@Seed()`, then call `create()` or `save()`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm'
import { faker } from '@faker-js/faker'
import { Seed, seed } from '@joakimbugge/typeorm-seeder'

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

// Build and return directly — no database needed
const author = await seed(Author).create()
// author.name → full name
// author.books → 3 Book instances each with their own seeded properties

// Persist to the database and return
const saved = await seed(Author).save({ dataSource })
// saved.id → assigned by TypeORM after save
```
