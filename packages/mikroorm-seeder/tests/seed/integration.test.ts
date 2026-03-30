import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, create, createMany } from '../../src';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;

  @Seed(() => faker.internet.email())
  @Property()
  email!: string;

  @Seed(() => faker.number.int({ min: 18, max: 80 }))
  @Property()
  age!: number;
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.sentence())
  @Property()
  title!: string;

  @Seed(() => faker.lorem.paragraphs(2))
  @Property()
  body!: string;

  @Seed(() => faker.datatype.boolean())
  @Property()
  published!: boolean;
}

describe('seeder integration', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Post],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('seeds and persists a User', async () => {
    const em = orm.em.fork();
    const user = await create(User);
    em.persist(user);
    await em.flush();

    expect(user.id).toBeGreaterThan(0);
    expect(typeof user.name).toBe('string');
    expect(user.name.length).toBeGreaterThan(0);
    expect(user.email).toContain('@');
    expect(user.age).toBeGreaterThanOrEqual(18);
    expect(user.age).toBeLessThanOrEqual(80);
  });

  it('seeds and persists a Post', async () => {
    const em = orm.em.fork();
    const post = await create(Post);
    em.persist(post);
    await em.flush();

    expect(post.id).toBeGreaterThan(0);
    expect(typeof post.title).toBe('string');
    expect(typeof post.body).toBe('string');
    expect(typeof post.published).toBe('boolean');
  });

  it('seeds multiple entities via createMany', async () => {
    const em = orm.em.fork();
    const users = await createMany(User, { count: 3 });
    em.persist(users);
    await em.flush();

    expect(users).toHaveLength(3);
    expect(new Set(users.map((u) => u.id)).size).toBe(3);
  });

  it('persisted values survive a fresh query', async () => {
    const em = orm.em.fork();
    const user = await create(User);
    em.persist(user);
    await em.flush();

    const em2 = orm.em.fork();
    const fetched = await em2.findOneOrFail(User, { id: user.id });

    expect(fetched.name).toBe(user.name);
    expect(fetched.email).toBe(user.email);
    expect(fetched.age).toBe(user.age);
  });

  it('passes EntityManager to factories via context', async () => {
    let receivedEm: MikroORM['em'] | undefined;

    class Probe {
      @Seed(({ em: e }) => {
        receivedEm = e as MikroORM['em'];
        return faker.lorem.word();
      })
      @Property()
      value!: string;
    }

    const em = orm.em.fork();
    await create(Probe, { em });

    expect(receivedEm).toBe(em);
  });
});
