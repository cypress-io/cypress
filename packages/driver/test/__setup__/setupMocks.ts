import { vi } from 'vitest'
import type sourceMapUtils from '../../src/cypress/source_map_utils'

// This is mocked in the setup file because vitest chokes on loading the .wasm file
// from the 'source-map' module. A solution to that should be found before unit testing
// source_map_utils.
vi.mock('../../src/cypress/source_map_utils', () => {
  return {
    getSourcePosition: vi.fn<typeof sourceMapUtils.getSourcePosition>(),
  }
})
