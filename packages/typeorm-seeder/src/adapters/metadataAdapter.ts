import type { MetadataAdapter } from '@joakimbugge/seeder';
import { getMetadataArgsStorage } from 'typeorm';

export const metadataAdapter: MetadataAdapter = {
  getEmbeds(hierarchy) {
    return getMetadataArgsStorage()
      .filterEmbeddeds(hierarchy)
      .map((e) => ({
        propertyName: e.propertyName,
        getClass: e.type as () => never,
      }));
  },

  getRelations(hierarchy) {
    return getMetadataArgsStorage()
      .filterRelations(hierarchy)
      .filter((r) => typeof r.type === 'function')
      .map((r) => ({
        propertyName: r.propertyName,
        getClass: r.type as () => never,
        isArray: r.relationType === 'one-to-many' || r.relationType === 'many-to-many',
      }));
  },
};
