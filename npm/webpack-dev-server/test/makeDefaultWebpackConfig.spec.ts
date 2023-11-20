import Chai, { expect } from 'chai'
import EventEmitter from 'events'
import snapshot from 'snap-shot-it'
import { IgnorePlugin } from 'webpack'
import type { CreateFinalWebpackConfig } from '../src/createWebpackDevServer'
import { makeCypressWebpackConfig } from '../src/makeDefaultWebpackConfig'
import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'
import sinon from 'sinon'
import SinonChai from 'sinon-chai'
import type { SourceRelativeWebpackResult } from '../src/helpers/sourceRelativeWebpackModules'
import path from 'path'

Chai.use(SinonChai)

describe('makeDefaultWebpackConfig', () => {
  it('supports custom indexHtmlFile', async () => {
    const devServerConfig: WebpackDevServerConfig = {
      specs: [],
      cypressConfig: {
        projectRoot: '.',
      } as Cypress.PluginConfigOptions,
    }

    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: createModuleMatrixResult({
        webpack: 4,
        webpackDevServer: 3,
      }),
    })

    // plugins contain circular deps which cannot be serialized in a snapshot.
    // instead just compare the name and order of the plugins.
    ;(actual as any).plugins = actual.plugins.map((p) => p.constructor.name)

    // these will include paths from the user's local file system, so we should not include them the snapshot
    delete actual.output.path
    delete actual.entry

    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })
})
