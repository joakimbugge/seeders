import { describe, expect, it } from 'vitest';
import { Seeder, getSeederMeta } from '../../src';

describe('@Seeder', () => {
  it('registers the class in the seeder registry', () => {
    @Seeder()
    class SimpleSeeder {
      async run() {}
    }

    const meta = getSeederMeta(SimpleSeeder);

    expect(meta).toBeDefined();
    expect(meta?.dependencies).toEqual([]);
  });

  it('defaults to an empty dependency list when options are omitted', () => {
    @Seeder()
    class NoDepsSeeder {
      async run() {}
    }

    expect(getSeederMeta(NoDepsSeeder)?.dependencies).toEqual([]);
  });

  it('stores provided dependencies', () => {
    @Seeder()
    class DepSeeder {
      async run() {}
    }

    @Seeder({ dependencies: [DepSeeder] })
    class MainSeeder {
      async run() {}
    }

    expect(getSeederMeta(MainSeeder)?.dependencies).toContain(DepSeeder);
  });

  it('stores multiple dependencies in declaration order', () => {
    @Seeder()
    class DepA {
      async run() {}
    }

    @Seeder()
    class DepB {
      async run() {}
    }

    @Seeder({ dependencies: [DepA, DepB] })
    class MultiDepSeeder {
      async run() {}
    }

    expect(getSeederMeta(MultiDepSeeder)?.dependencies).toEqual([DepA, DepB]);
  });
});
