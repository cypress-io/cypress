// necessary to have mocha types working correctly
import 'mocha'
import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import Fixtures from '@tooling/system-tests/lib/fixtures'
import { DataContext } from '../../src'
import { graphqlSchema } from '@packages/graphql/src/schema'
import type { BrowserApiShape } from '../../src/sources/BrowserDataSource'
import type { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape } from '../../src/actions'
import { ErrorApiShape } from '../../src/DataContext'
import { InjectedConfigApi } from '../../src/data'

export async function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return Fixtures.projectPath(project)
}

export function createTestDataContext () {
  return new DataContext({
    schema: graphqlSchema,
    mode: 'run',
    modeOptions: {},
    appApi: {} as AppApiShape,
    localSettingsApi: {} as LocalSettingsApiShape,
    authApi: {} as AuthApiShape,
    errorApi: {} as ErrorApiShape,
    configApi: {
      getServerPluginHandlers: () => [],
    } as InjectedConfigApi,
    projectApi: {} as ProjectApiShape,
    electronApi: {} as ElectronApiShape,
    browserApi: {} as BrowserApiShape,
  })
}
