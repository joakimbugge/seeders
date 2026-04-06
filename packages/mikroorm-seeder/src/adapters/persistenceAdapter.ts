import type { PersistenceAdapter, SeedContext } from '@joakimbugge/seeder';
import type { EntityManager } from '@mikro-orm/core';

/** Context required when persisting entities — `em` is mandatory. */
export interface PersistContext extends SeedContext {
  em: EntityManager;
}

export const persistenceAdapter: PersistenceAdapter<PersistContext> = {
  async save(_, entities, context) {
    const { em } = context;

    for (const entity of entities) {
      em.persist(entity);
    }

    await em.flush();

    return entities;
  },
};
