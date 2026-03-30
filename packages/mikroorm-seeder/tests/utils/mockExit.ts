import { vi } from 'vitest';

/** Mocks process.exit so it throws instead of terminating the test process. */
export function mockExit() {
  return vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit');
  });
}
