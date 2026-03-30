import { MikroORM } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { FixtureAuthor } from '../entities/FixtureAuthor.js';
import { FixtureBook } from '../entities/FixtureBook.js';

export async function createFixtureOrm(): Promise<MikroORM> {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [FixtureAuthor, FixtureBook],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.create();
  return orm;
}
