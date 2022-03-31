import * as Fixtures from '@tooling/system-tests/lib/fixtures'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import { expect } from 'chai'
import path from 'path'

import { sourceRelativeWebpackModules } from '../src/helpers/sourceRelativeWebpackModules'
import { WebpackDevServerConfig } from '../src/devServer'

type ProjectDirs = typeof e2eProjectDirs

const WEBPACK_REACT: Partial<Record<ProjectDirs[number], {
  webpack: number
  webpackDevServer: number
}>> = {
  'webpack4_wds3-react': {
    webpack: 4,
    webpackDevServer: 3,
  },
  'webpack4_wds4-react': {
    webpack: 4,
    webpackDevServer: 4,
  },
  'webpack5_wds3-react': {
    webpack: 5,
    webpackDevServer: 3,
  },
  'webpack5_wds4-react': {
    webpack: 5,
    webpackDevServer: 4,
  },
}

describe('sourceRelativeWebpackModules', () => {
  for (const [fixture, versionsToMatch] of Object.entries(WEBPACK_REACT)) {
    describe(fixture, () => {
      it(`sources the correct webpack versions for ${fixture}`, async () => {
        const projectRoot = await Fixtures.scaffoldProject(fixture)

        await FixturesScaffold.scaffoldProjectNodeModules(projectRoot)
        const result = sourceRelativeWebpackModules({
          cypressConfig: {
            projectRoot,
          },
        } as WebpackDevServerConfig)
        const projectNodeModules = require.resolve(path.join(projectRoot, 'node_modules'))

        expect(result.webpack.majorVersion).to.eq(versionsToMatch.webpack)
        expect(result.webpackDevServer.majorVersion).to.eq(versionsToMatch.webpackDevServer)
        expect(result.webpack.importPath).to.include(projectNodeModules)
        expect(result.webpackDevServer.importPath).to.include(projectNodeModules)
      })
    })
  }
})
