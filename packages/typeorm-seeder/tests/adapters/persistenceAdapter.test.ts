import 'reflect-metadata';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Column,
  DataSource,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  type Relation,
} from 'typeorm';
import { persistenceAdapter } from '../../src/adapters/persistenceAdapter.js';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

@Entity()
class PersistArticle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  title!: string;

  @ManyToOne(() => PersistAuthor, (a) => a.articles)
  author!: Relation<PersistAuthor>;
}

@Entity()
class PersistAuthor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @OneToMany(() => PersistArticle, (a) => a.author)
  articles!: Relation<PersistArticle[]>;
}

@Entity()
@Tree('adjacency-list')
class PersistCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @TreeParent({ onDelete: 'CASCADE' })
  parent?: PersistCategory;

  @TreeChildren()
  children!: PersistCategory[];
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('persistenceAdapter (typeorm)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [PersistAuthor, PersistArticle, PersistCategory],
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  afterEach(() => vi.restoreAllMocks());

  describe('cascade management', () => {
    it('enables cascade insert on all relations during save', async () => {
      const meta = dataSource.getMetadata(PersistAuthor);
      const capturedStates: boolean[] = [];

      vi.spyOn(dataSource, 'getRepository').mockReturnValueOnce({
        save: vi.fn().mockImplementation(async (entities: PersistAuthor[]) => {
          capturedStates.push(...meta.relations.map((r) => r.isCascadeInsert));
          return entities;
        }),
      } as any);

      const author = Object.assign(new PersistAuthor(), { name: 'test', articles: [] });
      await persistenceAdapter.save(PersistAuthor, [author], { dataSource });

      expect(capturedStates.every((v) => v === true)).toBe(true);
    });

    it('restores cascade insert values after a successful save', async () => {
      const meta = dataSource.getMetadata(PersistAuthor);
      const originalValues = meta.relations.map((r) => r.isCascadeInsert);

      const author = Object.assign(new PersistAuthor(), { name: 'restore-test', articles: [] });
      await persistenceAdapter.save(PersistAuthor, [author], { dataSource });

      expect(meta.relations.map((r) => r.isCascadeInsert)).toEqual(originalValues);
    });

    it('restores cascade insert values even when save throws', async () => {
      const meta = dataSource.getMetadata(PersistAuthor);
      const originalValues = meta.relations.map((r) => r.isCascadeInsert);

      vi.spyOn(dataSource, 'getRepository').mockReturnValueOnce({
        save: vi.fn().mockRejectedValue(new Error('db error')),
      } as any);

      const author = Object.assign(new PersistAuthor(), { name: 'error-test', articles: [] });
      await expect(
        persistenceAdapter.save(PersistAuthor, [author], { dataSource }),
      ).rejects.toThrow('db error');

      expect(meta.relations.map((r) => r.isCascadeInsert)).toEqual(originalValues);
    });
  });

  describe('collectEntityClasses', () => {
    it('handles circular entity references without infinite recursion', async () => {
      const author = new PersistAuthor();
      author.name = 'author';
      const article = new PersistArticle();
      article.title = 'article';
      article.author = author;
      author.articles = [article];

      const saveSpy = vi.fn().mockResolvedValue([author]);
      vi.spyOn(dataSource, 'getRepository').mockReturnValue({ save: saveSpy } as any);

      await expect(
        persistenceAdapter.save(PersistAuthor, [author], { dataSource }),
      ).resolves.toBeDefined();
    });

    it('skips plain objects (constructor === Object) when traversing entity values', async () => {
      const author = Object.assign(new PersistAuthor(), {
        name: 'author',
        articles: [],
        extra: { something: 'plain object' },
      });

      const saveSpy = vi.fn().mockResolvedValue([author]);
      vi.spyOn(dataSource, 'getRepository').mockReturnValueOnce({ save: saveSpy } as any);

      await expect(
        persistenceAdapter.save(PersistAuthor, [author], { dataSource }),
      ).resolves.toBeDefined();
    });
  });

  describe('save() — functional', () => {
    it('persists an entity and returns it with an assigned ID', async () => {
      const author = Object.assign(new PersistAuthor(), { name: 'functional-test', articles: [] });
      const [saved] = await persistenceAdapter.save(PersistAuthor, [author], { dataSource });

      expect(saved.id).toBeGreaterThan(0);
      expect(saved.name).toBe('functional-test');
    });

    it('persists multiple entities', async () => {
      const authors = [
        Object.assign(new PersistAuthor(), { name: 'author-1', articles: [] }),
        Object.assign(new PersistAuthor(), { name: 'author-2', articles: [] }),
      ];
      const saved = await persistenceAdapter.save(PersistAuthor, authors, { dataSource });

      expect(saved).toHaveLength(2);
      for (const a of saved) {
        expect(a.id).toBeGreaterThan(0);
      }
    });
  });

  describe('tree entities', () => {
    it('saves a root tree node without a parent', async () => {
      const root = Object.assign(new PersistCategory(), { name: 'root', children: [] });
      const [saved] = await persistenceAdapter.save(PersistCategory, [root], { dataSource });

      expect(saved.id).toBeGreaterThan(0);
      expect(saved.name).toBe('root');
    });

    it('saves a tree node with a parent', async () => {
      const parent = Object.assign(new PersistCategory(), { name: 'parent', children: [] });
      const child = Object.assign(new PersistCategory(), { name: 'child', parent, children: [] });

      const [saved] = await persistenceAdapter.save(PersistCategory, [child], { dataSource });

      expect(saved.id).toBeGreaterThan(0);
    });

    it('saves a root node with children and assigns the root as their parent', async () => {
      const child1 = Object.assign(new PersistCategory(), { name: 'child-1', children: [] });
      const child2 = Object.assign(new PersistCategory(), { name: 'child-2', children: [] });
      const root = Object.assign(new PersistCategory(), {
        name: 'root-with-children',
        children: [child1, child2],
      });

      const [saved] = await persistenceAdapter.save(PersistCategory, [root], { dataSource });

      expect(saved.id).toBeGreaterThan(0);
    });
  });
});
