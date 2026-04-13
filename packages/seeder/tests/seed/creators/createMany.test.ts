import { faker } from '@faker-js/faker';
import { Seed, createMany } from '../../../src';
import type { MetadataAdapter } from '../../../src';

const noOpAdapter: MetadataAdapter = {
  getEmbeds: () => [],
  getRelations: () => [],
};

class Widget {
  @Seed(() => faker.commerce.productName())
  name!: string;

  @Seed((_, __, i) => i)
  index!: number;
}

describe('createMany', () => {
  it('returns the requested number of instances', async () => {
    const widgets = await createMany(Widget, { count: 5 }, noOpAdapter);
    expect(widgets).toHaveLength(5);
  });

  it('each instance is of the correct class', async () => {
    const widgets = await createMany(Widget, { count: 3 }, noOpAdapter);
    widgets.forEach((w) => expect(w).toBeInstanceOf(Widget));
  });

  it('passes a zero-based index to factories', async () => {
    const widgets = await createMany(Widget, { count: 3 }, noOpAdapter);
    expect(widgets.map((w) => w.index)).toEqual([0, 1, 2]);
  });

  it('applies values overrides to every instance', async () => {
    const widgets = await createMany(Widget, { count: 3, values: { name: 'Fixed' } }, noOpAdapter);
    widgets.forEach((w) => expect(w.name).toBe('Fixed'));
  });

  it('applies factory values overrides with correct per-instance index', async () => {
    const widgets = await createMany(
      Widget,
      { count: 3, values: { name: (_, __, i) => `widget-${i}` } },
      noOpAdapter,
    );
    expect(widgets.map((w) => w.name)).toEqual(['widget-0', 'widget-1', 'widget-2']);
  });

  describe('previous context', () => {
    it('ctx.previous entry for the current type is empty for the first instance', async () => {
      let firstCount: number | undefined;

      class Tracked {
        @Seed((ctx) => {
          if (firstCount === undefined) {
            firstCount = ctx.previous?.get(Tracked)?.length;
          }
        })
        value!: unknown;
      }

      await createMany(Tracked, { count: 3 }, noOpAdapter);

      expect(firstCount).toBe(0);
    });

    it('ctx.previous contains all prior instances of the current type in order', async () => {
      const snapshots: number[][] = [];

      class Sequential {
        @Seed((ctx) => {
          const prev = ctx.previous?.get(Sequential) as Sequential[] | undefined;
          snapshots.push(prev?.map((s) => s.index) ?? []);
          return snapshots.length - 1;
        })
        index!: number;
      }

      await createMany(Sequential, { count: 3 }, noOpAdapter);

      expect(snapshots[0]).toEqual([]);
      expect(snapshots[1]).toEqual([0]);
      expect(snapshots[2]).toEqual([0, 1]);
    });

    it('a factory can derive its value from the previous instance', async () => {
      class Counter {
        @Seed((ctx) => {
          const prev = ctx.previous?.get(Counter) as Counter[] | undefined;
          return (prev?.at(-1)?.n ?? 0) + 1;
        })
        n!: number;
      }

      const items = await createMany(Counter, { count: 4 }, noOpAdapter);

      expect(items.map((c) => c.n)).toEqual([1, 2, 3, 4]);
    });

    it('child entity has no previous entry for its own type in a single (non-batch) creation', async () => {
      let childEntry: unknown = 'not-set';

      class Child {
        @Seed((ctx) => {
          childEntry = ctx.previous?.get(Child);
        })
        value!: unknown;
      }

      class Parent {
        @Seed()
        child!: Child;
      }

      const adapter: MetadataAdapter = {
        getEmbeds: () => [],
        getRelations: (hierarchy) =>
          hierarchy[0] === Parent
            ? [{ propertyName: 'child', getClass: () => Child, isArray: false }]
            : [],
      };

      await createMany(Parent, { count: 2 }, adapter);

      expect(childEntry).toBeUndefined();
    });

    it('child entity can see the parent batch via ctx.previous', async () => {
      const parentBatchSizes: number[] = [];

      class Child {
        @Seed((ctx) => {
          parentBatchSizes.push((ctx.previous?.get(Parent) as Parent[] | undefined)?.length ?? -1);
        })
        value!: unknown;
      }

      class Parent {
        @Seed()
        child!: Child;
      }

      const adapter: MetadataAdapter = {
        getEmbeds: () => [],
        getRelations: (hierarchy) =>
          hierarchy[0] === Parent
            ? [{ propertyName: 'child', getClass: () => Child, isArray: false }]
            : [],
      };

      await createMany(Parent, { count: 3 }, adapter);

      // Child for Parent[0] sees 0 prior parents, Child for Parent[1] sees 1, etc.
      expect(parentBatchSizes).toEqual([0, 1, 2]);
    });

    it('OneToMany child batch sees prior siblings via ctx.previous', async () => {
      class Book {
        @Seed((ctx) => {
          const prev = ctx.previous?.get(Book) as Book[] | undefined;
          return (prev?.length ?? 0) + 1;
        })
        order!: number;
      }

      class Author {
        @Seed({ count: 3 })
        books!: Book[];
      }

      const adapter: MetadataAdapter = {
        getEmbeds: () => [],
        getRelations: (hierarchy) => {
          if (hierarchy[0] === Author) {
            return [{ propertyName: 'books', getClass: () => Book, isArray: true }];
          }
          return [];
        },
      };

      const [author] = await createMany(Author, { count: 1 }, adapter);

      expect(author.books.map((b) => b.order)).toEqual([1, 2, 3]);
    });

    it('sibling OneToMany batches each start from an empty previous entry', async () => {
      class Book {
        @Seed((ctx) => {
          const prev = ctx.previous?.get(Book) as Book[] | undefined;
          return (prev?.length ?? 0) + 1;
        })
        order!: number;
      }

      class Author {
        @Seed({ count: 2 })
        books!: Book[];
      }

      const adapter: MetadataAdapter = {
        getEmbeds: () => [],
        getRelations: (hierarchy) => {
          if (hierarchy[0] === Author) {
            return [{ propertyName: 'books', getClass: () => Book, isArray: true }];
          }
          return [];
        },
      };

      // Two authors — each gets their own books starting from order 1
      const authors = await createMany(Author, { count: 2 }, adapter);

      expect(authors[0].books.map((b) => b.order)).toEqual([1, 2]);
      expect(authors[1].books.map((b) => b.order)).toEqual([1, 2]);
    });

    it('ctx.previous is available in values factory overrides', async () => {
      class Item {
        @Seed(() => 0)
        n!: number;
      }

      const previousLengths: number[] = [];

      const items = await createMany(
        Item,
        {
          count: 3,
          values: {
            n: (ctx, _, i) => {
              previousLengths.push(ctx.previous?.get(Item)?.length ?? -1);
              return i;
            },
          },
        },
        noOpAdapter,
      );

      expect(items.map((c) => c.n)).toEqual([0, 1, 2]);
      expect(previousLengths).toEqual([0, 1, 2]);
    });
  });

  it('array (multi-class) form creates count instances per class', async () => {
    class Tag {
      @Seed(() => faker.lorem.word())
      label!: string;
    }

    const [widgets, tags] = await createMany([Widget, Tag], { count: 2 }, noOpAdapter);
    expect(widgets).toHaveLength(2);
    expect(tags).toHaveLength(2);
  });
});
