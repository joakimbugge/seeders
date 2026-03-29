# Running scripts

::: tip Prefer skipping the script entirely?
The [CLI](/guide/cli) can load and run your seeders directly from the terminal — no seed script needed.
:::

## Running seed scripts

When running a seed script directly with Node.js, `reflect-metadata` must be the very first import — before any entity is loaded. TypeORM's decorators depend on it being in place when the class is evaluated.

```ts
import 'reflect-metadata'
import { seed } from '@joakimbugge/typeorm-seeder'
import { User } from './entities/User.js'

await seed(User).save({ dataSource })
```

### TypeScript execution

[tsx](https://github.com/privatenumber/tsx) is a popular choice for running TypeScript directly, but it uses esbuild under the hood which does not support `emitDecoratorMetadata`. This causes TypeORM to fail when inferring column types. Use [ts-node](https://github.com/TypeStrong/ts-node) instead.

**ESM projects** (`"type": "module"` or `"module": "nodenext"` in tsconfig):

```bash
node --no-warnings --loader ts-node/esm src/seed.ts
```

`--no-warnings` suppresses two noisy but harmless warnings emitted by ts-node itself: one about `--loader` being experimental, and one about ts-node internally using a deprecated `fs.Stats` constructor.

**CommonJS projects:**

```bash
# npm
npx ts-node src/seed.ts

# yarn
yarn ts-node src/seed.ts

# pnpm
pnpm exec ts-node src/seed.ts
```

## Loading entities from paths

`loadEntities` resolves a mixed array of entity constructors and glob patterns into a flat array of constructors — the same format TypeORM accepts in its `entities` DataSource option:

```ts
import { loadEntities, seed } from '@joakimbugge/typeorm-seeder'

const classes = await loadEntities([User, 'dist/entities/**/*.js'])
await seed(classes).saveMany(10, { dataSource })
```

String entries are expanded with glob and each matched file is dynamically imported. Every exported class constructor found in the module is collected. Constructor entries are passed through as-is.

## Loading seeders from paths

`loadSeeders` works the same way as `loadEntities` but collects only constructors decorated with `@Seeder`. Non-seeder exports in matched files are ignored.

```ts
import { loadSeeders, runSeeders } from '@joakimbugge/typeorm-seeder'

const seeders = await loadSeeders(['dist/seeders/**/*.js'])
await runSeeders(seeders, { dataSource })
```

Constructor entries are passed through as-is, so you can mix explicit references with glob patterns:

```ts
const seeders = await loadSeeders([UserSeeder, 'dist/seeders/Post*.js'])
await runSeeders(seeders, { dataSource })
```
