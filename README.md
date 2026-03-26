# typeorm-seeder

Monorepo for decorator-based TypeORM seeding. Two packages — a framework-agnostic core library and a NestJS integration module.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@joakimbugge/typeorm-seeder`](packages/typeorm-seeder) | [![npm](https://img.shields.io/npm/v/@joakimbugge/typeorm-seeder)](https://www.npmjs.com/package/@joakimbugge/typeorm-seeder) | Core seeding library |
| [`@joakimbugge/nest-typeorm-seeder`](packages/nest-typeorm-seeder) | [![npm](https://img.shields.io/npm/v/@joakimbugge/nest-typeorm-seeder)](https://www.npmjs.com/package/@joakimbugge/nest-typeorm-seeder) | NestJS module |

---

## @joakimbugge/typeorm-seeder

Annotate entity properties with `@Seed()`, then create or persist fully populated entity graphs with a single call — including relations, embedded types, and circular guards.

```ts
@Entity()
class Author {
  @Seed(() => faker.person.fullName())
  @Column()
  name!: string

  @Seed({ count: 3 })
  @OneToMany(() => Book, (b) => b.author)
  books!: Book[]
}

const author = await seed(Author).save({ dataSource })
// author.id     → assigned by the database
// author.books  → 3 persisted Book instances
```

Organise complex seeding scenarios into `@Seeder` classes with declared dependencies. The library topologically sorts and runs them in the correct order.

```ts
@Seeder({ dependencies: [UserSeeder] })
class PostSeeder implements SeederInterface {
  async run(ctx: SeedContext) {
    await seed(Post).saveMany(50, ctx)
  }
}

await runSeeders([PostSeeder], { dataSource })
// UserSeeder runs first, then PostSeeder
```

**[Full documentation →](packages/typeorm-seeder/README.md)**

---

## @joakimbugge/nest-typeorm-seeder

A NestJS module that runs your `@Seeder` classes on application bootstrap. Import `SeederModule` with the seeders you want executed and they run automatically when the app starts.

```ts
import { SeederModule } from '@joakimbugge/nest-typeorm-seeder'

@Module({
  imports: [
    TypeOrmModule.forRoot({ ... }),
    SeederModule.forRoot({ seeders: [PostSeeder] }),
  ],
})
export class AppModule {}
```

**[Full documentation →](packages/nest-typeorm-seeder/README.md)**

---

## Development

### Prerequisites

- Node.js >= 16.13.0
- [pnpm](https://pnpm.io/) >= 10

### Setup

```bash
pnpm install
```

### Scripts

| Command | Description |
|---|---|
| `pnpm -r run build` | Build all packages |
| `pnpm -r run test:run` | Run all tests |
| `pnpm -r run typecheck` | Type-check all packages |
| `pnpm -r run lint` | Lint all packages |
| `pnpm -r run fmt` | Format all packages |
| `pnpm run dev:watch` | Watch-build all packages in parallel |

### Toolchain

- **Build:** [tsdown](https://github.com/sxzz/tsdown) — bundles ESM and CommonJS outputs with declaration files
- **Test:** [vitest](https://vitest.dev/) — runs against an in-memory SQLite database via `better-sqlite3`
- **Lint:** [oxlint](https://oxc.rs/docs/guide/usage/linter.html)
- **Format:** [oxfmt](https://github.com/nicolo-ribaudo/oxfmt)
- **Git hooks:** [lefthook](https://github.com/evilmartians/lefthook) — runs lint and format on pre-commit

### Release

Releases are automated with [release-please](https://github.com/googleapis/release-please). Each package is versioned independently. Merging a release PR to `main` publishes the package to npm.

## License

MIT
