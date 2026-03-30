import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, create, createMany, save, saveMany } from '../../src';

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.company.name())
  @Property()
  name!: string;
}

@Entity()
class Writer {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;

  @Seed({ count: 2 })
  @OneToMany(() => Novel, (n) => n.writer)
  novels!: Novel[];
}

@Entity()
class Novel {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.words(3))
  @Property()
  title!: string;

  @Seed()
  @ManyToOne(() => Writer)
  writer!: Writer;
}

describe('array seed', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Publisher, Writer, Novel],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('create', () => {
    it('returns a tuple of instances matching the input array', async () => {
      const [writer, publisher] = await create([Writer, Publisher]);

      expect(writer).toBeInstanceOf(Writer);
      expect(publisher).toBeInstanceOf(Publisher);
    });

    it('seeds scalar properties on each entity', async () => {
      const [writer, publisher] = await create([Writer, Publisher]);

      expect(typeof writer.name).toBe('string');
      expect(typeof publisher.name).toBe('string');
    });

    it('skips relation seeding by default', async () => {
      const [writer] = await create([Writer, Publisher]);

      expect(writer.novels).toBeUndefined();
    });

    it('seeds relations when relations: true is passed', async () => {
      const [writer] = await create([Writer, Publisher], { relations: true });

      expect(writer.novels).toHaveLength(2);
    });
  });

  describe('createMany', () => {
    it('returns arrays of instances per class', async () => {
      const [writers, publishers] = await createMany([Writer, Publisher], { count: 3 });

      expect(writers).toHaveLength(3);
      expect(publishers).toHaveLength(3);
      writers.forEach((w) => expect(w).toBeInstanceOf(Writer));
      publishers.forEach((p) => expect(p).toBeInstanceOf(Publisher));
    });

    it('skips relations by default', async () => {
      const [writers] = await createMany([Writer, Publisher], { count: 2 });

      writers.forEach((w) => expect(w.novels).toBeUndefined());
    });

    it('seeds relations when relations: true is passed', async () => {
      const [writers] = await createMany([Writer, Publisher], { count: 2, relations: true });

      writers.forEach((w) => expect(w.novels).toHaveLength(2));
    });
  });

  describe('saveMany', () => {
    it('persists arrays of instances per class', async () => {
      const em = orm.em.fork();
      const [writers, publishers] = await saveMany([Writer, Publisher], { count: 2, em });

      expect(writers).toHaveLength(2);
      expect(publishers).toHaveLength(2);
      writers.forEach((w) => expect(w.id).toBeGreaterThan(0));
      publishers.forEach((p) => expect(p.id).toBeGreaterThan(0));
    });

    it('skips relation seeding by default', async () => {
      const em = orm.em.fork();
      const [writers] = await saveMany([Writer, Publisher], { count: 1, em });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(Writer, { id: writers[0]!.id }, { populate: ['novels'] });

      expect(fetched.novels).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('persists each entity independently', async () => {
      const em = orm.em.fork();
      const [writer, publisher] = await save([Writer, Publisher], { em });

      expect(writer.id).toBeGreaterThan(0);
      expect(publisher.id).toBeGreaterThan(0);
    });

    it('skips relation seeding by default', async () => {
      const em = orm.em.fork();
      const [writer] = await save([Writer, Publisher], { em });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(Writer, { id: writer.id }, { populate: ['novels'] });

      expect(fetched.novels).toHaveLength(0);
    });

    it('seeds and persists relations when relations: true is passed', async () => {
      const em = orm.em.fork();
      const [writer] = await save([Writer, Publisher], { em, relations: true });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(Writer, { id: writer.id }, { populate: ['novels'] });

      expect(fetched.novels).toHaveLength(2);
    });
  });
});
