import { vi } from 'vitest'
import type { ForNetworkInterception } from '@packages/network-interception'

export type MockNetworkInterception = ForNetworkInterception & {
  handle: ReturnType<typeof vi.fn<ForNetworkInterception['handle']>>
}

/** Passthrough {@link ForNetworkInterception} spy for proxy middleware unit tests. */
export function createMockNetworkInterception (): MockNetworkInterception {
  return {
    handle: vi.fn(async (request, next) => next(request)),
  }
}
