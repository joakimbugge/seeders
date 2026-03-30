import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, create, save } from '../../src';

@Entity()
class Profile {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.sentence())
  @Property()
  bio!: string;
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;

  @Seed()
  @OneToOne(() => Profile, { owner: true, nullable: true })
  profile!: Profile;
}

@Entity()
class Project {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.commerce.productName())
  @Property()
  name!: string;

  @Seed({ count: 3 })
  @OneToMany(() => Task, (t) => t.project)
  tasks!: Task[];
}

@Entity()
class Task {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.words(3))
  @Property()
  title!: string;

  @ManyToOne(() => Project)
  project!: Project;
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.word())
  @Property()
  name!: string;
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.sentence())
  @Property()
  title!: string;

  @Seed({ count: 2 })
  @ManyToMany(() => Tag)
  tags!: Tag[];
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;

  @Seed({ count: 2 })
  @OneToMany(() => Book, (b) => b.author)
  books!: Book[];
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.words(4))
  @Property()
  title!: string;

  @Seed()
  @ManyToOne(() => Author)
  author!: Author;
}

describe('relation seeding', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Profile, User, Task, Project, Tag, Article, Book, Author],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('one-to-one', () => {
    it('seeds and persists both sides', async () => {
      const em = orm.em.fork();
      const saved = await save(User, { em });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(User, { id: saved.id }, { populate: ['profile'] });

      expect(fetched.profile.id).toBeGreaterThan(0);
      expect(fetched.profile.bio).toBe(saved.profile.bio);
    });
  });

  describe('one-to-many', () => {
    it('seeds and persists all related entities', async () => {
      const em = orm.em.fork();
      const saved = await save(Project, { em });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(Project, { id: saved.id }, { populate: ['tasks'] });

      expect(fetched.tasks).toHaveLength(3);
      for (const t of fetched.tasks) {
        expect(t.id).toBeGreaterThan(0);
      }
    });

    it('undecorated back-reference on Task is not seeded', async () => {
      const project = await create(Project);

      project.tasks.forEach((t) => expect(t.project).toBeUndefined());
    });
  });

  describe('many-to-many', () => {
    it('seeds and persists the join table', async () => {
      const em = orm.em.fork();
      const saved = await save(Article, { em });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(Article, { id: saved.id }, { populate: ['tags'] });

      expect(fetched.tags).toHaveLength(2);
    });
  });

  describe('relations: false', () => {
    it('skips relation properties and leaves them undefined', async () => {
      const author = await create(Author, { relations: false });

      expect(author.books).toBeUndefined();
    });

    it('still seeds scalar properties', async () => {
      const author = await create(Author, { relations: false });

      expect(typeof author.name).toBe('string');
    });

    it('saves and skips relation properties', async () => {
      const em = orm.em.fork();
      const saved = await save(User, { em, relations: false });
      const fetched = await orm.em
        .fork()
        .findOneOrFail(User, { id: saved.id }, { populate: ['profile'] });

      expect(fetched.profile).toBeNull();
    });
  });

  describe('circular relations', () => {
    it('cuts the cycle at the ancestor boundary — books are created, their author is not', async () => {
      const author = await create(Author);

      expect(author.books).toHaveLength(2);
      author.books.forEach((book) => {
        expect(typeof book.title).toBe('string');
        expect(book.author).toBeUndefined();
      });
    });

    it('standalone Book seeding (no cycle) does create its author', async () => {
      const book = await create(Book);

      expect(book.author).toBeDefined();
      expect(typeof book.author.name).toBe('string');
      expect(book.author.books).toBeUndefined();
    });
  });
});
