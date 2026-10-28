import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import * as babel from '@babel/core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import getTsConfig from 'get-tsconfig'
import webpackPreprocessor from '@cypress/webpack-preprocessor'
const Debug = require('debug')

vi.mock('tsconfig-paths-webpack-plugin')

vi.mock('@cypress/webpack-preprocessor', async (importOriginal) => {
  const actualMod = await importOriginal<typeof import('@cypress/webpack-preprocessor')>()
  const actualPreprocessor = (actualMod as { default?: { getResolvedTypescriptVersion: (p?: string) => string | null } }).default ?? actualMod
  const mockedDefault = vi.fn().mockReturnValue((file) => undefined) as unknown as typeof webpackPreprocessor

  mockedDefault.getResolvedTypescriptVersion = vi.fn(actualPreprocessor.getResolvedTypescriptVersion)

  return {
    default: mockedDefault,
  }
})

vi.mock('get-tsconfig', () => {
  return {
    default: {
      getTsconfig: vi.fn(),
    },
  }
})

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
      expect(result.module.rules).toHaveLength(2)
      expect(result.resolve.extensions).toEqual(['.js', '.json', '.jsx', '.mjs'])
    })

    it('adds typescript config if path is specified', () => {
      const result = getFullWebpackOptions('file/path', 'typescript/path')

      expect(result.module.rules).toHaveLength(3)
      expect(result.module.rules[2].use[0].loader).toContain('ts-loader')
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

    describe('JavaScript babel-loader rule', () => {
      const getJsBabelOptions = (webpackOptions: ReturnType<typeof getFullWebpackOptions>) => {
        return webpackOptions.module.rules[1].use[0].options
      }

      const entryName = (entry: unknown): string => {
        const name = Array.isArray(entry) ? entry[0] : entry

        if (typeof name !== 'string') throw new Error(`expected a resolved plugin or preset path, got ${JSON.stringify(entry)}`)

        return name
      }

      it('caches uncompressed transforms and targets the browsers Cypress launches', () => {
        const options = getJsBabelOptions(getFullWebpackOptions('foo'))
        const presetEnv = options.presets.find((preset) => entryName(preset).includes('preset-env'))

        expect(options.cacheCompression).toBe(false)
        expect(Array.isArray(presetEnv) && presetEnv[1]).toMatchObject({ targets: { chrome: '100', firefox: '140', safari: '16.4' } })
      })

      it('keys the cache on the configured Babel packages and their direct dependencies', () => {
        const { cacheIdentifier } = getJsBabelOptions(getFullWebpackOptions('foo'))

        expect(cacheIdentifier).toContain(`@babel/core@${require('@babel/core/package.json').version}`)
        expect(cacheIdentifier).toContain(`babel-loader@${require('babel-loader/package.json').version}`)
        expect(cacheIdentifier).toContain(`@babel/preset-env@${require('@babel/preset-env/package.json').version}`)
        // preset-env's targets data, whose package.json `exports` hides
        expect(cacheIdentifier).toMatch(/(^|,)@babel\/compat-data@\d/)
        expect(cacheIdentifier).toMatch(/(^|,)@babel\/plugin-transform-private-methods@\d/)
        expect(cacheIdentifier).not.toContain('@missing')
      })

      it('leaves class fields and object rest/spread to the browser', () => {
        const plugins = getJsBabelOptions(getFullWebpackOptions('foo')).plugins.map(entryName)

        expect(plugins.some((p) => p.includes('plugin-transform-class-properties'))).toBe(false)
        expect(plugins.some((p) => p.includes('plugin-transform-object-rest-spread'))).toBe(false)
      })

      describe('cache directory', () => {
        const originalCwd = process.cwd()
        const originalCacheDir = process.env.CACHE_DIR
        let tmp: string

        beforeEach(async () => {
          tmp = await fs.promises.realpath(await fs.promises.mkdtemp(path.join(os.tmpdir(), 'wbip-cache-')))
          delete process.env.CACHE_DIR
        })

        afterEach(async () => {
          process.chdir(originalCwd)

          if (originalCacheDir === undefined) {
            delete process.env.CACHE_DIR
          } else {
            process.env.CACHE_DIR = originalCacheDir
          }

          await fs.promises.rm(tmp, { recursive: true, force: true })
        })

        // The module was loaded from the package folder, so this also covers a
        // cwd that changes after load.
        const getCacheDirectoryFrom = async (cwd: string) => {
          process.chdir(cwd)

          return getJsBabelOptions(getFullWebpackOptions('foo')).cacheDirectory
        }

        it('creates and uses node_modules/.cache of the nearest package.json', async () => {
          await fs.promises.mkdir(path.join(tmp, 'project/cypress/e2e'), { recursive: true })
          await fs.promises.writeFile(path.join(tmp, 'project/package.json'), '{}')

          const expected = path.join(tmp, 'project/node_modules/.cache/babel-loader')

          expect(await getCacheDirectoryFrom(path.join(tmp, 'project/cypress/e2e'))).toEqual(expected)
          expect((await fs.promises.stat(expected)).isDirectory()).toBe(true)
        })

        it('uses CACHE_DIR when it is set', async () => {
          process.env.CACHE_DIR = path.join(tmp, 'shared-cache')

          expect(await getCacheDirectoryFrom(tmp)).toEqual(path.join(tmp, 'shared-cache/babel-loader'))
        })

        // Assumes no package.json sits above the OS temp folder.
        it('turns the cache off when no package.json file sits above the cwd', async () => {
          // a folder named package.json is not a project root
          await fs.promises.mkdir(path.join(tmp, 'project/package.json'), { recursive: true })

          expect(await getCacheDirectoryFrom(path.join(tmp, 'project'))).toBe(false)
        })

        it('turns the cache off when its folder cannot be created', async () => {
          await fs.promises.mkdir(path.join(tmp, 'project'))
          await fs.promises.writeFile(path.join(tmp, 'project/package.json'), '{}')
          // a file where node_modules should be makes mkdir fail, even for root
          await fs.promises.writeFile(path.join(tmp, 'project/node_modules'), '')

          expect(await getCacheDirectoryFrom(path.join(tmp, 'project'))).toBe(false)
        })
      })
    })
  })

  describe('preprocessor', () => {
    let webpackOptions

    beforeEach(() => {
      // Pin TS < 6 so assertions on forwarded tsconfig compilerOptions stay stable when the monorepo uses TypeScript 6+.
      vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue('5.4.5')
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

    describe('with typescript below 6', () => {
      const fixtureTsconfigPath = path.resolve(__dirname, '../../test/fixtures/tsconfig.json')

      beforeEach(() => {
        vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue('5.4.5')
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

      it('forwards compilerOptions from tsconfig and does not pass configFile to ts-loader', () => {
        vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
          config: {
            compilerOptions: {
              module: 'ESNext',
              moduleResolution: 'Bundler',
              downlevelIteration: true,
            },
          },
          path: fixtureTsconfigPath,
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
        expect(tsLoader.options.configFile).toBeUndefined()
        expect(tsLoader.options.compilerOptions).toEqual({
          module: 'ESNext',
          moduleResolution: 'Bundler',
          downlevelIteration: true,
        })
      })
    })

    describe('with typescript 6 or newer', () => {
      const fixtureTsconfigPath = path.resolve(__dirname, '../../test/fixtures/tsconfig.json')

      it.each(['6.0.2', '6.0.0-beta', '6.0.0-rc.1'] as const)(
        'when resolved version is %s, passes configFile to ts-loader and does not forward compilerOptions from tsconfig (ts-loader reads options from the file)',
        (resolvedVersion) => {
          vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue(resolvedVersion)

          vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
            config: {
              compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'Bundler',
                downlevelIteration: true,
              },
            },
            path: fixtureTsconfigPath,
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
          expect(tsLoader.options.configFile).toBe(fixtureTsconfigPath)
          expect(tsLoader.options.compilerOptions).toBeUndefined()
        },
      )

      it('when resolved version fails semver.valid, does not pass configFile or user compilerOptions to ts-loader', () => {
        vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue('not-a-semver-version')

        vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
          config: {
            compilerOptions: {
              module: 'ESNext',
              moduleResolution: 'Bundler',
            },
          },
          path: fixtureTsconfigPath,
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

        expect(tsLoader.options.configFile).toBeUndefined()
        expect(tsLoader.options.compilerOptions).toBeUndefined()
      })
    })

    describe('with typescript 7 or newer', () => {
      const fixtureTsconfigPath = path.resolve(__dirname, '../../test/fixtures/tsconfig.json')

      const entryName = (entry: unknown) => (Array.isArray(entry) ? entry[0] : entry) as string

      it.each(['7.0.0', '7.0.2', '7.1.0-beta', '8.0.0'] as const)(
        'when resolved version is %s, uses babel-loader with @babel/preset-typescript instead of ts-loader',
        (resolvedVersion) => {
          vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue(resolvedVersion)

          vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
            config: {
              compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'Bundler',
              },
            },
            path: fixtureTsconfigPath,
          })

          const preprocessorCB = preprocessor({
            typescript: true,
            webpackOptions,
          })

          preprocessorCB({
            filePath: 'foo.ts',
            outputPath: '.js',
          } as any)

          const rule = webpackOptions.module.rules[0]
          const loader = rule.use[0]
          const presets = loader.options.presets.map(entryName)
          const plugins = loader.options.plugins.map(entryName)

          expect(rule.test.toString()).toEqual(/\.m?tsx?$/.toString())
          expect(loader.loader).toContain('babel-loader')
          expect(loader.loader).not.toContain('ts-loader')
          expect(presets.some((p: string) => p.includes('preset-typescript'))).toBe(true)
          // emitDecoratorMetadata parity: metadata transform must precede the decorators transform
          const metadataIdx = plugins.findIndex((p: string) => p.includes('babel-plugin-transform-typescript-metadata'))
          const decoratorsIdx = plugins.findIndex((p: string) => p.includes('plugin-proposal-decorators'))

          expect(metadataIdx).toBeGreaterThanOrEqual(0)
          expect(decoratorsIdx).toBeGreaterThan(metadataIdx)
          // legacy decorators need decorated class fields lowered in the same pass
          const classPropertiesIdx = plugins.findIndex((p: string) => p.includes('plugin-transform-class-properties'))

          expect(classPropertiesIdx).toBeGreaterThan(decoratorsIdx)
          expect(loader.options.cacheDirectory).toEqual(path.resolve(__dirname, '../../node_modules/.cache/babel-loader'))
          expect(loader.options.cacheIdentifier).toContain('@babel/preset-typescript@')
        },
      )

      it('compiles decorators alongside the class features the targets support natively', () => {
        vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue('7.0.2')

        vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
          config: {
            compilerOptions: {
              module: 'ESNext',
              moduleResolution: 'Bundler',
            },
          },
          path: fixtureTsconfigPath,
        })

        preprocessor({
          typescript: true,
          webpackOptions,
        })({
          filePath: 'foo.ts',
          outputPath: '.js',
        } as any)

        // cache* options belong to babel-loader, not @babel/core
        const { cacheDirectory, cacheIdentifier, cacheCompression, ...babelOptions } = webpackOptions.module.rules[0].use[0].options
        const source = `
          function inject (target: any, key: string) {}
          class Service {}
          class Widget {
            @inject service!: Service
            #count = 0
            static registry = new Map<string, Widget>()
            static { Widget.registry.clear() }
            #bump () { return ++this.#count }
            static isWidget (o: object) { return #count in o }
            constructor (public name: string) {}
            @inject render (svc: Service): number { return this.#bump() }
          }
          export const { name, ...rest } = new Widget('w')
        `

        const { code } = babel.transformSync(source, { ...babelOptions, filename: path.join(__dirname, 'widget.ts') })!

        expect(code).toContain('_applyDecoratedDescriptor')
        expect(code).toContain('Reflect.metadata')
        expect(code).toContain('...rest')
      })

      it('still registers the tsconfig paths plugin so path aliases resolve', () => {
        vi.mocked(webpackPreprocessor.getResolvedTypescriptVersion).mockReturnValue('7.0.2')

        vi.mocked(getTsConfig).getTsconfig.mockReturnValue({
          config: {
            compilerOptions: {
              module: 'ESNext',
              moduleResolution: 'Bundler',
            },
          },
          path: fixtureTsconfigPath,
        })

        const preprocessorCB = preprocessor({
          typescript: true,
          webpackOptions,
        })

        preprocessorCB({
          filePath: 'foo.ts',
          outputPath: '.js',
        } as any)

        expect(webpackOptions.resolve.extensions).toEqual(expect.arrayContaining(['.ts', '.tsx']))
        expect(webpackOptions.resolve.plugins).toHaveLength(1)
      })
    })
  })
})
