import { expect, it, describe, beforeEach, afterAll } from 'vitest'
import * as Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import type { fixtureDirs } from '@tooling/system-tests'
import path from 'path'
import fs from 'fs'

import { restoreLoadHook, sourceDefaultWebpackDependencies } from '../src/helpers/sourceRelativeWebpackModules'
import { WebpackDevServerConfig } from '../src/devServer'

type ProjectDirs = typeof fixtureDirs

const CY_ROOT = path.join(__dirname, '..', '..', '..')

const WEBPACK_REACT: Partial<Record<ProjectDirs[number], {
  webpack: number
  webpackDevServer: number
  htmlWebpackPlugin: number
}>> = {
  'webpack5_wds5-react': {
    webpack: 5,
    webpackDevServer: 5,
    htmlWebpackPlugin: 5,
  },
}

async function sourceModulesForProject (fixture: ProjectDirs[number]) {
  Fixtures.remove()
  const projectRoot = await Fixtures.scaffoldProject(fixture)

  await FixturesScaffold.scaffoldProjectNodeModules({ project: fixture })

  const result = sourceDefaultWebpackDependencies({
    cypressConfig: {
      projectRoot,
    },
  } as WebpackDevServerConfig)

  return { result, projectRoot }
}

// Ensures that we are properly sourcing the webpacks from the node_modules in the given project,
// rather than from the node_modules in the project root
describe('sourceDefaultWebpackDependencies', () => {
  beforeEach(() => {
    restoreLoadHook()
  })

  afterAll(() => {
    restoreLoadHook()
  })

  for (const [fixture, versionsToMatch] of Object.entries(WEBPACK_REACT)) {
    describe(fixture, () => {
      it(`sources the correct webpack versions for ${fixture}`, { timeout: 30000 }, async () => {
        const { result, projectRoot } = await sourceModulesForProject(fixture as ProjectDirs[number])
        const projectNodeModules = fs.realpathSync(path.resolve(projectRoot, 'node_modules'))

        expect(result.webpack.majorVersion, 'match webpackVersion').toEqual(versionsToMatch.webpack)
        expect(result.webpackDevServer.majorVersion, 'match webpackDevServerVersion').toEqual(versionsToMatch.webpackDevServer)
        expect(result.webpack.importPath).toContain(projectNodeModules)
        expect(result.webpackDevServer.importPath).toContain(projectNodeModules)
      })
    })
  }

  it('sources the webpack path from the correct location once imported', { timeout: 30000 }, async () => {
    expect(require.resolve('webpack')).toContain(CY_ROOT)
    const localWebpack = require('webpack')

    const { result, projectRoot } = await sourceModulesForProject('webpack5_wds5-react')
    const projectNodeModules = fs.realpathSync(path.resolve(projectRoot, 'node_modules'))

    expect(localWebpack).not.toEqual(result.webpack.module)
    expect(result.webpack.importPath).toContain(projectNodeModules)
    expect(result.webpack.majorVersion, 'match webpackVersion').toEqual(5)
    expect(require('webpack')).toEqual(result.webpack.module)
    expect(require.resolve('webpack')).toContain(projectNodeModules)
  })
})
