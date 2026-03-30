# Getting started

Decorator-based entity seeding for MikroORM. Annotate entity properties with `@Seed()`, then create or persist fully populated entity graphs with a single call — including relations, embedded types, and circular guards. Organize complex seeding scenarios into `@Seeder` classes with declared dependencies that are automatically ordered and executed.

## Installation

```bash
# npm
npm install @joakimbugge/mikroorm-seeder @mikro-orm/core

# yarn
yarn add @joakimbugge/mikroorm-seeder @mikro-orm/core

# pnpm
pnpm add @joakimbugge/mikroorm-seeder @mikro-orm/core
```

## Metadata providers

MikroORM requires a metadata provider to infer property types from decorators. `mikroorm-seeder` works with both — choose the one that fits your setup.

::: warning ES decorators are not supported
`mikroorm-seeder` requires **legacy decorators** (`experimentalDecorators: true`). The newer TC39 ES decorator proposal — which MikroORM also supports via `@mikro-orm/decorators` — is not currently supported. Attempting to use ES decorators will result in relations and embedded properties not being auto-seeded.
:::

### ReflectMetadataProvider

Reads type information emitted by the TypeScript compiler at runtime. Requires `reflect-metadata` and `emitDecoratorMetadata: true`.

```bash
npm install reflect-metadata
```

```ts
import 'reflect-metadata'
import { MikroORM, ReflectMetadataProvider } from '@mikro-orm/core'

const orm = await MikroORM.init({
  metadataProvider: ReflectMetadataProvider,
  entities: [User, Post],
  // ...
})
```

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

If you use SWC, also enable `decoratorMetadata: true` in your SWC config.

### TsMorphMetadataProvider

Reads type information directly from TypeScript source files. Does not require `reflect-metadata` or `emitDecoratorMetadata`. Requires `@mikro-orm/reflection`:

```bash
npm install @mikro-orm/reflection
```

```ts
import { MikroORM } from '@mikro-orm/core'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'

const orm = await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  entities: [User, Post],
  // ...
})
```

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Basic usage

Import entity decorators from `@mikro-orm/decorators/legacy`, annotate properties with `@Seed()`, then call `create()` or `save()`:

```ts
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
