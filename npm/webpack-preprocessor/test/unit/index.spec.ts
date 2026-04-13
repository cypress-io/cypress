import { expect, it, describe, beforeEach, vi, Mock } from 'vitest'
import webpack from 'webpack'
import Bluebird from 'bluebird'
import preprocessor from '../../index'
import { overrideSourceMaps } from '../../lib/typescript-overrides'
import { getResolvedTypescriptVersion } from '../../lib/get-typescript'
import EventEmitter from 'node:events'

vi.mock('webpack')

vi.mock('../../lib/typescript-overrides', () => {
  return {
    overrideSourceMaps: vi.fn(),
  }
})

vi.mock('../../lib/get-typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/get-typescript')>()

  return {
    ...actual,
    getResolvedTypescriptVersion: vi.fn(actual.getResolvedTypescriptVersion),
  }
})

describe('webpack preprocessor', function () {
  let watchApi: {
    close: () => void
  }
  let compilerApi: {
    run: Mock<(callback: (err: Error, stats: webpack.Stats) => webpack.Stats) => webpack.Stats>
    watch: Mock<(callback: (err: Error, stats: webpack.Stats) => void) => void>
    plugin: Mock<(name: string, callback: () => void) => void>
  }

  let statsApi: {
    hasErrors: () => boolean
    toJson: () => { warnings: string[], errors: string[] }
  }

  let file: any

  let run: (options?: any, fileToProcess?: any) => Promise<string>

  beforeEach(function () {
    vi.resetAllMocks()

    watchApi = {
      close: vi.fn(),
    }

    compilerApi = {
      run: vi.fn(),
      watch: vi.fn().mockReturnValue(watchApi),
      plugin: vi.fn(),
    }

    vi.mocked(webpack).mockReturnValue(compilerApi as unknown as webpack.MultiCompiler)

    statsApi = {
      hasErrors () {
        return false
      },
      toJson () {
        return { warnings: [], errors: [] }
      },
    }

    const fileEventEmitter = new EventEmitter()

    file = {
      filePath: 'path/to/file.js',
      outputPath: 'output/output.js',
      shouldWatch: false,
      on: vi.fn().mockImplementation(fileEventEmitter.on),
      emit: vi.fn().mockImplementation(fileEventEmitter.emit),
    }

    run = (options, fileToProcess = file) => {
      return preprocessor(options)(fileToProcess)
    }
  })

  describe('exported function', function () {
    it('receives user options and returns a preprocessor function', function () {
      expect(preprocessor({})).toBeInstanceOf(Function)
    })

    it('has defaultOptions attached to it', function () {
      expect(preprocessor.defaultOptions).toBeInstanceOf(Object)
      expect(preprocessor.defaultOptions.webpackOptions.module.rules).toBeInstanceOf(Array)
    })

    it('defaultOptions are deeply cloned, preserving regexes', () => {
      // @ts-expect-error
      expect(preprocessor.defaultOptions.webpackOptions.module.rules[0]?.test).toBeInstanceOf(RegExp)
    })
  })

  describe('preprocessor function', function () {
    afterEach(function () {
      // resets the cached bundles in the case the test did not clean up the deferred promise
      file.emit('close')
    })

    describe('when it finishes cleanly', function () {
      beforeEach(function () {
        compilerApi.run.mockImplementation((callback) => {
          return callback(null, statsApi as unknown as webpack.Stats)
        })
      })

      it('runs webpack', () => {
        // @ts-expect-error - __bundles is private and not typed
        expect(preprocessor.__bundles()[file.filePath]).toBeUndefined()

        run()

        // should have a deferred promise
        // @ts-expect-error - __bundles is private and not typed
        expect(preprocessor.__bundles()[file.filePath].deferreds).toHaveLength(1)
        // @ts-expect-error - __bundles is private and not typed
        expect(preprocessor.__bundles()[file.filePath].promise).toBeInstanceOf(Bluebird)
        expect(webpack).toHaveBeenCalled()

        // clean up the deferred promise
        file.emit('close')

        // @ts-expect-error - __bundles is private and not typed
        expect(preprocessor.__bundles()[file.filePath]).toBeUndefined()
      })

      it('returns existing bundle if called again with same filePath', async function () {
        const run = preprocessor({})

        await run(file)
        await run(file)
        expect(webpack).toHaveBeenCalledOnce()
      })

      it('specifies the entry file', async function () {
        await run()
        expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
          entry: [file.filePath],
        }))
      })

      it('includes additional entry files', async function () {
        await run({
          additionalEntries: ['entry-1.js', 'entry-2.js'],
        })

        expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
          entry: [
            file.filePath,
            'entry-1.js',
            'entry-2.js',
          ],
        }))
      })

      it('specifies output path and filename', async function () {
        await run()

        expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
          output: {
            path: 'output',
            filename: 'output.js',
            publicPath: '',
          },
        }))
      })

      it('adds .js extension to filename when the originating file had been no javascript file', async function () {
        file.outputPath = 'output/output.ts'

        await run()
        expect(webpack).toHaveBeenLastCalledWith(expect.objectContaining({
          output: {
            publicPath: '',
            path: 'output',
            filename: 'output.ts.js',
          },
        }))
      })

      describe('devtool', function () {
        it('enables inline source maps', async function () {
          await run()
          expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
            devtool: 'inline-source-map',
          }))

          expect(overrideSourceMaps).toHaveBeenCalledWith(true, undefined)
        })

        it('does not enable inline source maps when devtool is false', async function () {
          await run({ webpackOptions: { devtool: false, module: { rules: [] } } })

          expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
            devtool: false,
          }))

          expect(overrideSourceMaps).toHaveBeenCalledWith(false, undefined)
        })

        it('always sets devtool even when mode is "production"', async function () {
          await run({ webpackOptions: { mode: 'production', module: { rules: [] } } })

          expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
            devtool: 'inline-source-map',
          }))

          expect(overrideSourceMaps).toHaveBeenCalledWith(true, undefined)
        })
      })

      describe('mode', function () {
        it('sets mode to development by default', async function () {
          await run()
          expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'development',
          }))
        })

        it('follows user mode if present', async function () {
          await run({ webpackOptions: { mode: 'production', module: { rules: [] } } })
          expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'production',
          }))
        })
      })

      it('runs when shouldWatch is false', async function () {
        await run()
        expect(compilerApi.run).toHaveBeenCalled()
      })

      it('watches when shouldWatch is true', async function () {
        file.shouldWatch = true
        // @ts-expect-error
        compilerApi.watch.mockImplementation((watchOptions, callback) => {
          callback(null, statsApi as unknown as webpack.Stats)

          return watchApi
        })

        await run()
        expect(compilerApi.watch).toHaveBeenCalled()
      })

      it('includes watchOptions if provided', async function () {
        file.shouldWatch = true
        // @ts-expect-error
        compilerApi.watch.mockImplementation((watchOptions, callback) => {
          callback(null, statsApi as unknown as webpack.Stats)

          return watchApi
        })

        await run({ watchOptions: { poll: true } })
        expect(compilerApi.watch).toHaveBeenCalledWith(expect.objectContaining({
          poll: true,
        }), expect.any(Function))
      })

      it('resolves with the output path', async function () {
        const outputPath = await run()

        expect(outputPath).toEqual(file.outputPath)
      })

      it('adds .js extension and resolves with that output path when the originating file had been no javascript file', async function () {
        file.outputPath = 'output/output.ts'

        const outputPath = await run()

        expect(outputPath).toEqual('output/output.ts.js')
      })

      it('emits "rerun" when shouldWatch is true after there is an update', async function () {
        file.shouldWatch = true
        let onWatchHandler: (err: Error | null, stats: webpack.Stats) => void
        let onCompile: () => void

        // @ts-expect-error
        compilerApi.watch.mockImplementation((webpackOptions, callback: (err: Error | null, stats: webpack.Stats) => void) => {
          onWatchHandler = callback

          callback(null, statsApi as unknown as webpack.Stats)

          return watchApi
        })

        compilerApi.plugin.mockImplementation((name, callback) => {
          if (name === 'compile') {
            onCompile = callback

            return callback()
          }
        })

        await run()
        expect(file.emit).not.toHaveBeenCalledWith('rerun')

        // mock a re-compile
        // compiler function triggers first
        onCompile()
        // followed by the watch handler, which signals completion
        onWatchHandler(null, statsApi as unknown as webpack.Stats)
        await new Promise((resolve) => setTimeout(resolve, 100)) // give assertion time till next tick

        expect(file.emit).toHaveBeenCalledWith('rerun')
      })

      it('does not emit "rerun" when shouldWatch is false', async function () {
        file.shouldWatch = false
        compilerApi.plugin.mockImplementation((name, callback) => {
          if (name === 'compile') {
            return callback()
          }
        })

        await run()
        expect(file.emit).not.toHaveBeenCalledWith('rerun')
      })

      it('closes bundler when shouldWatch is true and `close` is emitted', async function () {
        file.shouldWatch = true
        // @ts-expect-error
        compilerApi.watch.mockImplementation((watchOptions, callback) => {
          callback(null, statsApi as unknown as webpack.Stats)

          return watchApi
        })

        await run()
        file.emit('close')
        expect(watchApi.close).toHaveBeenCalled()
      })

      it('does not close bundler when shouldWatch is false and `close` is emitted', async function () {
        await run()
        file.emit('close')
        expect(watchApi.close).not.toHaveBeenCalled()
      })

      it('uses default webpack options when no user options', async function () {
        await run()
        expect(webpack).toHaveBeenLastCalledWith(expect.objectContaining(
          {
            mode: 'development',
            module: {
              rules: [
                {
                  test: /\.jsx?$/,
                  exclude: [/node_modules/],
                  use: [
                    {
                      loader: 'babel-loader',
                      options: {
                        presets: ['@babel/preset-env'],
                      },
                    },
                  ],
                },
              ],
            },
          },
        ))
      })

      it('does not use default options when user options are non-default', async function () {
        await run({ webpackOptions: { module: { rules: [] } } })
        expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
          module: {
            rules: [],
          },
        }))
      })
    })

    describe('when it errors', function () {
      let err: {
        stack: string
      }

      beforeEach(function () {
        err = {
          stack: 'Failed to preprocess...',
        }
      })

      it('it rejects with error when an err', async function () {
        compilerApi.run.mockImplementation((callback) => {
          return callback(err as Error, statsApi as unknown as webpack.Stats)
        })

        // @ts-expect-error - __bundles is private and not typed
        expect(preprocessor.__bundles()[file.filePath]).toBeUndefined()

        try {
          await run()
          throw new Error('should not be called')
        } catch (err) {
          // @ts-expect-error - __bundles is private and not typed
          expect(preprocessor.__bundles()[file.filePath].deferreds).toHaveLength(0)
          // @ts-expect-error - __bundles is private and not typed
          expect(preprocessor.__bundles()[file.filePath].promise).toBeInstanceOf(Bluebird)
          expect(err.stack).toEqual(err.stack)
        }
      })

      it('it rejects with joined errors when a stats err and strips stacktrace', async function () {
        const errs = ['foo\nat Object.foo', 'bar', 'baz']
        const errsNoStack = ['foo', 'bar', 'baz']

        statsApi = {
          hasErrors () {
            return true
          },
          toJson () {
            return { warnings: [], errors: errs }
          },
        }

        compilerApi.run.mockImplementation((callback) => {
          return callback(null, statsApi as unknown as webpack.Stats)
        })

        try {
          await run()
          throw new Error('should not be called')
        } catch (err) {
          expect(err.message).toEqual(`Webpack Compilation Error\n${errsNoStack.join('\n\n')}`)
        }
      })
    })

    describe('ts-loader', function () {
      beforeEach(async function () {
        const actual = await vi.importActual<typeof import('../../lib/get-typescript')>('../../lib/get-typescript')

        vi.mocked(getResolvedTypescriptVersion).mockImplementation(actual.getResolvedTypescriptVersion)
        compilerApi.run.mockImplementation((callback) => {
          return callback(null, statsApi as unknown as webpack.Stats)
        })
      })

      const COMPILER_PERMUTATIONS = [
        undefined,
        {
          sourceMap: false,
          inlineSourceMap: true,
          inlineSources: true,
          downlevelIteration: false,
        },
      ]

      type TypeScriptVersionBehavior = 5 | 6

      const expectedTsLoaderCompilerOptions = (
        tsBehavior: TypeScriptVersionBehavior,
        inputCompilerOptions: typeof COMPILER_PERMUTATIONS[number],
      ) => {
        return {
          ...(inputCompilerOptions || {}),
          sourceMap: true,
          inlineSourceMap: false,
          inlineSources: false,
          ...(tsBehavior === 5 ? { downlevelIteration: true } : {}),
        }
      }

      // @see https://github.com/cypress-io/cypress/issues/32266
      it('matches ts-loader explicitly and does not add configuration if not ts-loader', async function () {
        const options = {
          webpackOptions: {
            module: {
              rules: [
                {
                  test: /\.tsx?$/,
                  exclude: [/node_modules/],
                  use: {
                    loader: 'exports-loader',
                    options: {},
                  },
                },
              ],
            },
          },
        }

        await run(options)
        expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                exclude: [/node_modules/],
                use: {
                  loader: 'exports-loader',
                  options: {},
                },
              },
            ],
          },
        }))
      })

      // eslint-disable-next-line quotes
      const TS_LOADER_NAMES = ['ts-loader', "ts-loader", 'foo/ts-loader/dist/index.js']

      const runTsLoaderOverrideSuite = (versionLabel: string, tsBehavior: TypeScriptVersionBehavior) => {
        describe(`when ${versionLabel}`, function () {
          COMPILER_PERMUTATIONS.forEach((compilerOptions) => {
            TS_LOADER_NAMES.forEach((tsLoaderName) => {
              describe(`sets Cypress overrides to compiler options when compiler options are ${compilerOptions ? 'defined' : 'undefined'} when`, function () {
                it(`rules is an array of "use" objects with ${tsLoaderName}`, async function () {
                  const options = {
                    webpackOptions: {
                      module: {
                        rules: [
                          {
                            test: /\.tsx?$/,
                            exclude: [/node_modules/],
                            use: {
                              loader: tsLoaderName,
                              options: {
                                compilerOptions,
                              },
                            },
                          },
                        ],
                      },
                    },
                  }

                  await run(options)
                  expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
                    module: {
                      rules: [
                        {
                          test: /\.tsx?$/,
                          exclude: [/node_modules/],
                          use: {
                            loader: tsLoaderName,
                            options: {
                              compilerOptions: expectedTsLoaderCompilerOptions(tsBehavior, compilerOptions),
                            },
                          },
                        },
                      ],
                    },
                  }))
                })

                it(`rules is an array of "use" array objects ${tsLoaderName}`, async function () {
                  const options = {
                    webpackOptions: {
                      module: {
                        rules: [
                          {
                            test: /\.tsx?$/,
                            exclude: [/node_modules/],
                            use: [{
                              loader: tsLoaderName,
                              options: {
                                compilerOptions,
                              },
                            }],
                          },
                        ],
                      },
                    },
                  }

                  await run(options)
                  expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
                    module: {
                      rules: [
                        {
                          test: /\.tsx?$/,
                          exclude: [/node_modules/],
                          use: [{
                            loader: tsLoaderName,
                            options: {
                              compilerOptions: expectedTsLoaderCompilerOptions(tsBehavior, compilerOptions),
                            },
                          }],
                        },
                      ],
                    },
                  }))
                })

                it(`rules is an array of "loader" objects ${tsLoaderName}`, async function () {
                  const options = {
                    webpackOptions: {
                      module: {
                        rules: [
                          {
                            test: /\.tsx?$/,
                            exclude: [/node_modules/],
                            loader: tsLoaderName,
                            options: {
                              compilerOptions,
                            },
                          },
                        ],
                      },
                    },
                  }

                  await run(options)
                  expect(webpack).toHaveBeenCalledWith(expect.objectContaining({
                    module: {
                      rules: [
                        {
                          test: /\.tsx?$/,
                          exclude: [/node_modules/],
                          loader: tsLoaderName,
                          options: {
                            compilerOptions: expectedTsLoaderCompilerOptions(tsBehavior, compilerOptions),
                          },
                        },
                      ],
                    },
                  }))
                })
              })
            })
          })
        })
      }

      describe('TypeScript is below 6', function () {
        beforeEach(function () {
          vi.mocked(getResolvedTypescriptVersion).mockReturnValue('5.4.5')
        })

        runTsLoaderOverrideSuite('TypeScript is below 6', 5)
      })

      describe('TypeScript is 6 or newer', function () {
        beforeEach(function () {
          vi.mocked(getResolvedTypescriptVersion).mockReturnValue('6.0.2')
        })

        runTsLoaderOverrideSuite('TypeScript is 6 or newer', 6)
      })

      describe('TypeScript 6 pre-release', function () {
        beforeEach(function () {
          vi.mocked(getResolvedTypescriptVersion).mockReturnValue('6.0.0-beta')
        })

        runTsLoaderOverrideSuite('TypeScript 6 pre-release', 6)
      })

      describe('TypeScript version cannot be resolved', function () {
        beforeEach(function () {
          vi.mocked(getResolvedTypescriptVersion).mockReturnValue(null)
        })

        runTsLoaderOverrideSuite('TypeScript version cannot be resolved', 6)
      })

      describe('TypeScript version string is not valid semver', function () {
        beforeEach(function () {
          vi.mocked(getResolvedTypescriptVersion).mockReturnValue('not-a-semver-version')
        })

        runTsLoaderOverrideSuite('TypeScript version string is not valid semver', 6)
      })
    })
  })
})
