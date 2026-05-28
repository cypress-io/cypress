import { vi } from 'vitest'

// Mock the WASM file import
vi.mock('source-map/lib/mappings.wasm', () => {
  return {
    default: vi.fn(),
  }
})
