// necessary to have mocha types working correctly
import 'mocha'
import path from 'path'
import fs from 'fs-extra'
import Fixtures, { fixtureDirs, scaffoldProject } from '@tooling/system-tests'
import { DataContext, DataContextConfig } from '../../src'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { remoteSchemaWrapped as schemaCloud } from '@packages/graphql/src/stitching/remoteSchemaWrapped'
import type { BrowserApiShape } from '../../src/sources/BrowserDataSource'
import type { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape } from '../../src/actions'
import { InjectedConfigApi } from '../../src/data'
import sinon from 'sinon'

type SystemTestProject = typeof fixtureDirs[number]
type SystemTestProjectPath<T extends SystemTestProject> = `${string}/system-tests/projects/${T}`

export { scaffoldProject }

export function getSystemTestProject<T extends typeof fixtureDirs[number]> (project: T): SystemTestProjectPath<T> {
  return path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects', project) as SystemTestProjectPath<T>
}

export function removeCommonNodeModules () {
  fs.rmSync(path.join(Fixtures.cyTmpDir, 'node_modules'), { recursive: true, force: true })
}

export async function scaffoldMigrationProject (project: typeof fixtureDirs[number]): Promise<string> {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return Fixtures.projectPath(project)
}

export function createTestDataContext (mode: DataContextConfig['mode'] = 'run') {
  return new DataContext({
    schema: graphqlSchema,
    schemaCloud,
    mode,
    modeOptions: {},
    appApi: {} as AppApiShape,
    localSettingsApi: {} as LocalSettingsApiShape,
    authApi: {
      logIn: sinon.stub().throws('not stubbed'),
      resetAuthState: sinon.stub(),
    } as unknown as AuthApiShape,
    configApi: {} as InjectedConfigApi,
    projectApi: {
      closeActiveProject: sinon.stub(),
    } as unknown as ProjectApiShape,
    electronApi: {
      isMainWindowFocused: sinon.stub().returns(false),
      focusMainWindow: sinon.stub(),
      copyTextToClipboard: (text) => {},
    } as unknown as ElectronApiShape,
    browserApi: {
      focusActiveBrowserWindow: sinon.stub(),
      getBrowsers: sinon.stub().resolves([]),
    } as unknown as BrowserApiShape,
  })
}
