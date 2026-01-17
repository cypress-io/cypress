import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'
import EventEmitter from 'events'
import debug from 'debug'

const cypressConfig = {
  projectRoot: path.join(__dirname, 'test-fixtures'),
  devServerPublicPathRoute: path.join(__dirname, './test-public-path'),
  indexHtmlFile: path.join(__dirname, 'component-index.html'),
} as Cypress.PluginConfigOptions

vi.mock('../src/helpers/sourceRelativeWebpackModules', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    sourceDefaultWebpackDependencies: vi.fn(),
  }
})

describe('devServer', { timeout: 10000 }, function () {
  it('creates a new devServer webpack5, webpackDevServer5', async () => {
    const sourceRelativeWebpackModules = await import('../src/helpers/sourceRelativeWebpackModules')

    vi.mocked(sourceRelativeWebpackModules.sourceDefaultWebpackDependencies).mockReturnValue(createModuleMatrixResult({
      webpack: 5,
      webpackDevServer: 5,
    }))

    const { devServer } = await import('../src/devServer')

    const result = await devServer.create({
      specs: [],
      cypressConfig,
      webpackConfig: {},
      devServerEvents: new EventEmitter(),
    })

    const webpackDevServer = await import('webpack-dev-server')

    expect(result.server).toBeInstanceOf(webpackDevServer.default)
    expect(result.version).toEqual(5)
  })

  // Writing to disk includes the correct source map size, where the difference will be made up from stat size vs parsed size
  // This is critical if a user is trying to debug to determine if they have large source maps or other large files in their dev-server under test
  describe('writes to disk if DEBUG=cypress-verbose:webpack-dev-server:bundle-analyzer is set', async () => {
    const WEBPACK_DEV_SERVER_VERSIONS: (5)[] = [5]

    beforeEach(() => {
      debug.enable('cypress-verbose:webpack-dev-server:bundle-analyzer')
    })

    afterEach(() => {
      debug.disable()
    })

    WEBPACK_DEV_SERVER_VERSIONS.forEach((version) => {
      it(`works for webpack-dev-server v${version}`, async () => {
        const sourceRelativeWebpackModules = await import('../src/helpers/sourceRelativeWebpackModules')

        vi.mocked(sourceRelativeWebpackModules.sourceDefaultWebpackDependencies).mockReturnValue(createModuleMatrixResult({
          webpack: version,
          webpackDevServer: version,
        }))

        const { devServer } = await import('../src/devServer')

        const result = await devServer.create({
          specs: [],
          cypressConfig,
          webpackConfig: {},
          devServerEvents: new EventEmitter(),
        })

        // @ts-expect-error - options isn't typed
        expect(result.server.options.devMiddleware.writeToDisk).toBe(true)
      })
    })
  })
})
