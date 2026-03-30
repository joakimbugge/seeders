# Getting started

Decorator-based entity seeding for MikroORM. Annotate entity properties with `@Seed()`, then create or persist fully populated entity graphs with a single call — including relations, embedded types, and circular guards. Organize complex seeding scenarios into `@Seeder` classes with declared dependencies that are automatically ordered and executed.

## Installation

`@mikro-orm/core` and `reflect-metadata` are peer dependencies.

```bash
# npm
npm install @joakimbugge/mikroorm-seeder @mikro-orm/core reflect-metadata

# yarn
yarn add @joakimbugge/mikroorm-seeder @mikro-orm/core reflect-metadata

# pnpm
pnpm add @joakimbugge/mikroorm-seeder @mikro-orm/core reflect-metadata
```

## TypeScript configuration

Enable legacy decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

::: warning ES decorators are not supported
`mikroorm-seeder` requires **legacy decorators** (`experimentalDecorators: true`). The newer TC39 ES decorator proposal — which MikroORM also supports via `@mikro-orm/decorators` — is not currently supported. Attempting to use ES decorators will result in relations and embedded properties not being auto-seeded.
:::

`emitDecoratorMetadata: true` is required when using `ReflectMetadataProvider` (the most common setup). If you use `TsMorphMetadataProvider` instead, it can be omitted — see [Metadata providers](#metadata-providers).

## Metadata providers

MikroORM needs a metadata provider to infer property types from decorators. `mikroorm-seeder` works with both supported providers — you must configure one explicitly.

### ReflectMetadataProvider

Reads `design:type` emitted by the TypeScript compiler. Requires `emitDecoratorMetadata: true` in `tsconfig.json` and a TypeScript compiler that emits it (SWC with `decoratorMetadata: true`, or `tsc`).

```ts
import 'reflect-metadata'
import { MikroORM } from '@mikro-orm/core'
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy'

const orm = await MikroORM.init({
  metadataProvider: ReflectMetadataProvider,
  entities: [User, Post],
  // ...
})
```

### TsMorphMetadataProvider

Reads property types directly from TypeScript source files using ts-morph. Does not require `emitDecoratorMetadata`. Install it separately:

```bash
npm install @mikro-orm/reflection
```

```ts
import 'reflect-metadata'
import { MikroORM } from '@mikro-orm/core'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'

const orm = await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  entities: [User, Post],
  // ...
})
```

## Basic usage

Import entity decorators from `@mikro-orm/decorators/legacy`, annotate properties with `@Seed()`, then call `create()` or `save()`:

```ts
import 'reflect-metadata'
import { Entity, PrimaryKey, Property, OneToMany, ManyToOne } from '@mikro-orm/decorators/legacy'
import { faker } from '@faker-js/faker'
import { Seed, create, save } from '@joakimbugge/mikroorm-seeder'

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

// Create in memory — no database required
const author = await create(Author)
// author.name → full name
// author.books → 3 Book instances each with their own seeded properties

// Create and persist to the database
const saved = await save(Author, { em })
// saved.id → assigned by MikroORM after flush
```
