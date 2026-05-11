import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { metadataAdapter } from '../../src/adapters/metadataAdapter.js';

// ---------------------------------------------------------------------------
// Test entities
// ---------------------------------------------------------------------------

class Address {
  @Column({ type: 'text' })
  street!: string;
}

@Entity()
class MetaTag {
  @PrimaryGeneratedColumn()
  id!: number;
}

@Entity()
class MetaComment {
  @PrimaryGeneratedColumn()
  id!: number;
}

@Entity()
class MetaPost {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => MetaUser, (u) => u.posts)
  user!: Relation<MetaUser>;

  @ManyToMany(() => MetaTag)
  @JoinTable()
  tags!: Relation<MetaTag[]>;

  @OneToOne(() => MetaComment)
  pinned!: Relation<MetaComment>;
}

@Entity()
class MetaUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => MetaPost, (p) => p.user)
  posts!: Relation<MetaPost[]>;

  @Column(() => Address)
  address!: Address;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('metadataAdapter (typeorm)', () => {
  describe('getEmbeds()', () => {
    it('returns embeds registered via @Column(() => EmbedClass)', () => {
      const embeds = metadataAdapter.getEmbeds([MetaUser]);

      const addressEmbed = embeds.find((e) => e.propertyName === 'address');
      expect(addressEmbed).toBeDefined();
      expect(typeof addressEmbed!.getClass).toBe('function');
      expect(addressEmbed!.getClass()).toBe(Address);
    });

    it('returns empty array for an entity with no embeds', () => {
      const embeds = metadataAdapter.getEmbeds([MetaPost]);
      expect(embeds).toHaveLength(0);
    });

    it('returns empty array for a hierarchy with no embedded classes', () => {
      const embeds = metadataAdapter.getEmbeds([MetaPost, MetaTag, MetaComment]);
      expect(embeds).toHaveLength(0);
    });
  });

  describe('getRelations()', () => {
    it('returns empty array for an entity with no relations', () => {
      const relations = metadataAdapter.getRelations([MetaTag]);
      expect(relations).toHaveLength(0);
    });

    it('marks many-to-one as isArray: false', () => {
      const relations = metadataAdapter.getRelations([MetaPost]);
      const userRel = relations.find((r) => r.propertyName === 'user');

      expect(userRel).toBeDefined();
      expect(userRel!.isArray).toBe(false);
    });

    it('marks one-to-many as isArray: true', () => {
      const relations = metadataAdapter.getRelations([MetaUser]);
      const postsRel = relations.find((r) => r.propertyName === 'posts');

      expect(postsRel).toBeDefined();
      expect(postsRel!.isArray).toBe(true);
    });

    it('marks many-to-many as isArray: true', () => {
      const relations = metadataAdapter.getRelations([MetaPost]);
      const tagsRel = relations.find((r) => r.propertyName === 'tags');

      expect(tagsRel).toBeDefined();
      expect(tagsRel!.isArray).toBe(true);
    });

    it('marks one-to-one as isArray: false', () => {
      const relations = metadataAdapter.getRelations([MetaPost]);
      const pinnedRel = relations.find((r) => r.propertyName === 'pinned');

      expect(pinnedRel).toBeDefined();
      expect(pinnedRel!.isArray).toBe(false);
    });

    it('returns the target class via getClass()', () => {
      const relations = metadataAdapter.getRelations([MetaPost]);
      const userRel = relations.find((r) => r.propertyName === 'user');

      expect(userRel!.getClass()).toBe(MetaUser);
    });

    it('all returned relations have getClass as a function', () => {
      const relations = metadataAdapter.getRelations([MetaPost]);
      for (const rel of relations) {
        expect(typeof rel.getClass).toBe('function');
      }
    });
  });
});
