import { describe, it, vi, expect } from 'vitest'
import path from 'node:path'
import { getTypescript } from '../../lib/get-typescript'
// NOTE: mock-require is a deprecated package that is no longer maintained, but it plays nicely with Vitest unlike proxyquire.
// We are leveraging mock-require here until we are able to fully convert the package to ESM, where we can construct a proper mock from the module API.
// @see https://github.com/vitest-dev/vitest/discussions/3134
import mockRequire from 'mock-require'

describe('./lib/get-typescript', () => {
  describe('.getTypescript', () => {
    it('require "default" typescript if typescript option not specified', () => {
      let mockTypeScript = {
        version: '4.5.0',
        createProgram: vi.fn(),
      }

      const tsResolvedPath = require.resolve('typescript')

      mockRequire(tsResolvedPath, mockTypeScript)

      const resolvedTypeScript = getTypescript()

      expect(mockTypeScript.createProgram).toEqual(resolvedTypeScript.createProgram)

      mockRequire.stop(tsResolvedPath)
    })

    it('requires typescript from typescript option if specified', () => {
      let mockTypeScript = {
        version: '4.5.0',
        createProgram: vi.fn(),
      }

      const fullPathToMockUserTsconfig = path.join(__dirname, '../fixtures/mock_user_tsconfig.json')

      mockRequire(fullPathToMockUserTsconfig, mockTypeScript)

      const resolvedTypeScript = getTypescript('./test/fixtures/mock_user_tsconfig.json')

      expect(mockTypeScript.createProgram).toEqual(resolvedTypeScript.createProgram)

      mockRequire.stop(fullPathToMockUserTsconfig)
    })
  })
})
