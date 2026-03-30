import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Seed, create } from '../../src';

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.sentence())
  @Property()
  title!: string;

  @Seed(() => faker.lorem.paragraphs(1))
  @Property()
  body!: string;
}

describe('TsMorphMetadataProvider', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: TsMorphMetadataProvider,
      entities: [Article],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('seeds and persists an entity', async () => {
    const em = orm.em.fork();
    const article = await create(Article);
    em.persist(article);
    await em.flush();

    expect(article.id).toBeGreaterThan(0);
    expect(typeof article.title).toBe('string');
    expect(typeof article.body).toBe('string');
  });
});
