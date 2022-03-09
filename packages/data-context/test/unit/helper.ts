// necessary to have mocha types working correctly
import 'mocha'
import path from 'path'
import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import Fixtures from '@tooling/system-tests/lib/fixtures'
import { DataContext, DataContextConfig } from '../../src'
import { graphqlSchema } from '@packages/graphql/src/schema'
import type { BrowserApiShape } from '../../src/sources/BrowserDataSource'
import type { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape } from '../../src/actions'
import { InjectedConfigApi } from '../../src/data'

type SystemTestProject = typeof e2eProjectDirs[number]
type SystemTestProjectPath<T extends SystemTestProject> = `${string}/system-tests/projects/${T}`

export function getSystemTestProject<T extends typeof e2eProjectDirs[number]> (project: T): SystemTestProjectPath<T> {
  return path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects', project) as SystemTestProjectPath<T>
}

export async function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return Fixtures.projectPath(project)
}

export function createTestDataContext (mode: DataContextConfig['mode'] = 'run') {
  return new DataContext({
    schema: graphqlSchema,
    mode,
    modeOptions: {},
    appApi: {} as AppApiShape,
    localSettingsApi: {} as LocalSettingsApiShape,
    authApi: {} as AuthApiShape,
    configApi: {
      getServerPluginHandlers: () => [],
    } as InjectedConfigApi,
    projectApi: {} as ProjectApiShape,
    electronApi: {
      copyTextToClipboard: (text) => {},
    } as ElectronApiShape,
    browserApi: {} as BrowserApiShape,
  })
}
