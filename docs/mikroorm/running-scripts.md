# Running scripts

## Running seed scripts

When running a seed script directly with Node.js, `reflect-metadata` must be the very first import — before any entity is loaded. MikroORM's decorators depend on it being in place when the class is evaluated.

```ts
import 'reflect-metadata'
import { seed } from '@joakimbugge/mikroorm-seeder'
import { User } from './entities/User.js'

await seed(User).save({ em })
```

### TypeScript execution

Which TypeScript executor you can use depends on which [metadata provider](/mikroorm/#metadata-providers) you have configured.

**With `ReflectMetadataProvider`** — requires `emitDecoratorMetadata: true`. [tsx](https://github.com/privatenumber/tsx) uses esbuild under the hood, which does not emit `design:type`, so it will not work. Use [ts-node](https://github.com/TypeStrong/ts-node) instead.

ESM projects (`"type": "module"` or `"module": "nodenext"` in tsconfig):

```bash
node --no-warnings --loader ts-node/esm src/seed.ts
```

CommonJS projects:

```bash
npx ts-node src/seed.ts
```

**With `TsMorphMetadataProvider`** — reads TypeScript source files directly, so `emitDecoratorMetadata` is not needed. tsx works fine:

```bash
npx tsx src/seed.ts
```

## Loading seeders from paths

`loadSeeders` resolves a mixed array of seeder constructors and glob patterns into a flat array of constructors — only classes decorated with `@Seeder` are collected:

```ts
import { loadSeeders, runSeeders } from '@joakimbugge/mikroorm-seeder'

const seeders = await loadSeeders(['dist/seeders/**/*.js'])
await runSeeders(seeders, { em })
```

Constructor entries are passed through as-is, so you can mix explicit references with glob patterns:

```ts
const seeders = await loadSeeders([UserSeeder, 'dist/seeders/Post*.js'])
await runSeeders(seeders, { em })
```
