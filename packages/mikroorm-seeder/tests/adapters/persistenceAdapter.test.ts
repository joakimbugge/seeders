import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { persistenceAdapter } from '../../src/adapters/persistenceAdapter.js';

describe('persistenceAdapter (mikroorm)', () => {
  describe('save()', () => {
    it('calls em.persist() for each entity', async () => {
      const em = { persist: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) };
      const entities = [{ id: 1 }, { id: 2 }];

      await persistenceAdapter.save(Object as any, entities as any, { em: em as any });

      expect(em.persist).toHaveBeenCalledTimes(2);
      expect(em.persist).toHaveBeenCalledWith(entities[0]);
      expect(em.persist).toHaveBeenCalledWith(entities[1]);
    });

    it('calls em.flush() exactly once after all persists', async () => {
      const em = { persist: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) };
      const entities = [{ id: 1 }, { id: 2 }, { id: 3 }];

      await persistenceAdapter.save(Object as any, entities as any, { em: em as any });

      expect(em.flush).toHaveBeenCalledOnce();
    });

    it('persists all entities before flushing', async () => {
      const order: string[] = [];
      const em = {
        persist: vi.fn().mockImplementation(() => order.push('persist')),
        flush: vi.fn().mockImplementation(async () => order.push('flush')),
      };
      const entities = [{ id: 1 }, { id: 2 }];

      await persistenceAdapter.save(Object as any, entities as any, { em: em as any });

      expect(order).toEqual(['persist', 'persist', 'flush']);
    });

    it('returns the original entities array', async () => {
      const em = { persist: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) };
      const entities = [{ id: 1 }, { id: 2 }];

      const result = await persistenceAdapter.save(Object as any, entities as any, {
        em: em as any,
      });

      expect(result).toBe(entities);
    });

    it('flushes even when the entities array is empty', async () => {
      const em = { persist: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) };

      const result = await persistenceAdapter.save(Object as any, [], { em: em as any });

      expect(em.persist).not.toHaveBeenCalled();
      expect(em.flush).toHaveBeenCalledOnce();
      expect(result).toEqual([]);
    });

    it('ignores the EntityClass argument', async () => {
      const em = { persist: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) };
      const entities = [{ id: 1 }];

      // The first argument (EntityClass) is unused — pass anything.
      await expect(
        persistenceAdapter.save(null as any, entities as any, { em: em as any }),
      ).resolves.toBe(entities);
    });
  });
});
