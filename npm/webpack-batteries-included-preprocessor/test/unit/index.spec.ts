import { describe, it, beforeEach, expect, vi } from 'vitest'
import path from 'node:path'
import getTsConfig from 'get-tsconfig'
const Debug = require('debug')

vi.mock('tsconfig-paths-webpack-plugin')

vi.mock('@cypress/webpack-preprocessor', () => ({
  default: vi.fn().mockReturnValue((file) => undefined),
}))

vi.mock('get-tsconfig', () => ({
  default: {
    getTsconfig: vi.fn(),
  },
}))

describe('webpack-batteries-included-preprocessor', () => {
  let preprocessor: typeof import('../../index')
  let getFullWebpackOptions: typeof import('../../index').getFullWebpackOptions

  beforeEach(async () => {
    vi.resetModules()

    ;({ default: preprocessor, getFullWebpackOptions } = await import('../../index'))
  })

  describe('#getFullWebpackOptions', () => {
    it('returns default webpack options (and does not add typescript config if no path specified)', () => {
      const result = getFullWebpackOptions('foo')

      expect(result.node.global).toBe(true)
      expect(result.module.rules).toHaveLength(3)
      expect(result.resolve.extensions).toEqual(['.js', '.json', '.jsx', '.mjs', '.coffee'])
    })

    it('adds typescript config if path is specified', () => {
      const result = getFullWebpackOptions('file/path', 'typescript/path')

      expect(result.module.rules).toHaveLength(4)
      expect(result.module.rules[3].use[0].loader).toContain('ts-loader')
    })

    it('adds the BundleAnalyzerPlugin if the user is trying to debug their bundle', async () => {
      Debug.enable('cypress-verbose:webpack-batteries-included-preprocessor:bundle-analyzer')

      vi.resetModules()
      getFullWebpackOptions = (await import('../../index')).getFullWebpackOptions
      const result = getFullWebpackOptions('file/path', 'typescript/path')

      expect(result.plugins).toHaveLength(2)
      expect(result.plugins[1].constructor.name).toEqual('BundleAnalyzerPlugin')
      Debug.disable()
    })
  })

  describe('#getTSCompilerOptionsForUser', () => {
    let webpackOptions

    beforeEach(() => {
      webpackOptions = {
        module: {
          rules: [],
        },
        resolve: {
          extensions: [],
          plugins: [],
        },
      }
    })

    it('correctly passes the options in the user\'s tsconfig.json options into ts-loader', () => {
      vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
        config: {
          compilerOptions: {
            module: 'ESNext',
            moduleResolution: 'Bundler',
          },
        },
        path: path.resolve(__dirname, '../../test/fixtures/tsconfig.json'),
      })

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      } as any)

      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.loader).toContain('ts-loader')

      expect(tsLoader.options.compiler).toEqual(require.resolve('typescript'))
      expect(tsLoader.options.logLevel).toEqual('error')
      expect(tsLoader.options.silent).toBe(true)
      expect(tsLoader.options.transpileOnly).toBe(true)

      // compilerOptions are overridden (sourceMap=true) by `@cypress/webpack-preprocessor` if ts-loader is present
      expect(tsLoader.options.compilerOptions).toEqual({
        module: 'ESNext',
        moduleResolution: 'Bundler',
      })
    })

    it('overrides node10 option as node as they are the same thing and is simpler for ts-loader to parse', () => {
      vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
        config: {
          compilerOptions: {
            module: 'commonjs',
            moduleResolution: 'node10',
          },
        },
        path: path.resolve(__dirname, '../../test/fixtures/tsconfig.json'),
      })

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      } as any)

      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.options.compilerOptions).toEqual({
        module: 'commonjs',
        moduleResolution: 'node',
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/18938. ts-loader needs a tsconfig.json file to work.
    it('throws an error if the user\'s tsconfig.json is not found', () => {
      vi.mocked(getTsConfig).getTsconfig.mockReturnValue(null)

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      expect(() => {
        return preprocessorCB({
          filePath: 'foo.ts',
          outputPath: '.js',
        } as any)
      }).toThrow('No tsconfig.json found. ts-loader needs a tsconfig.json file to work. Please add one to your project in either the root or the cypress directory.')
    })

    it('throws an error if the user\'s typescript is not found', () => {
      vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
        config: {
          compilerOptions: {
            module: 'commonjs',
            moduleResolution: 'node16',
          },
        },
        path: '/does/not/exist',
      })

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      expect(() => {
        return preprocessorCB({
          filePath: 'foo.ts',
          outputPath: '.js',
        } as any)
      }).toThrow('No typescript installable was found. ts-loader needs a version of typescript to work properly. Please install typescript in your project\'s package.json.')
    })
  })
})
