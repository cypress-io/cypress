import { describe, it, expect } from 'vitest'

// NOTE: these relative paths only work from the ./dist folder
require('../test/fixtures/circular-deps/hook-require')
const result = require('../test/fixtures/circular-deps/lib/entry')

describe('Circular Dependency', () => {
  it('is properly processed', () => {
    expect(result.origin).toEqual('definitions')
    expect(result.result).toEqual(4)
  })
})
