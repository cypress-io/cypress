// necessary to have mocha types working correctly
import 'mocha'
import path from 'path'
import fs from 'fs-extra'
import { Response } from 'cross-fetch'
import Fixtures, { fixtureDirs, scaffoldProject, removeProject } from '@tooling/system-tests'
import { DataContext, DataContextConfig } from '../../src'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { remoteSchemaWrapped as schemaCloud } from '@packages/graphql/src/stitching/remoteSchemaWrapped'
import type { BrowserApiShape } from '../../src/sources/BrowserDataSource'
import type { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape, CohortsApiShape } from '../../src/actions'
import sinon from 'sinon'
import { execute, parse } from 'graphql'
import { getOperationName } from '@urql/core'
import { CloudQuery } from '@packages/graphql/test/stubCloudTypes'
import { remoteSchema } from '@packages/graphql/src/stitching/remoteSchema'
import type { OpenModeOptions, RunModeOptions } from '@packages/types'
import { MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import { RelevantRunInfo } from '../../src/gen/graphcache-config.gen'
import dedent from 'dedent'
import os from 'os'

type SystemTestProject = typeof fixtureDirs[number]
type SystemTestProjectPath<T extends SystemTestProject> = `${string}/system-tests/projects/${T}`

export { scaffoldProject, removeProject }

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

export function createTestDataContext (mode: DataContextConfig['mode'] = 'run', modeOptions: Partial<RunModeOptions | OpenModeOptions> = {}) {
  const ctx = new DataContext({
    schema: graphqlSchema,
    schemaCloud,
    mode,
    modeOptions,
    appApi: {} as AppApiShape,
    localSettingsApi: {
      getPreferences: sinon.stub().resolves({
        majorVersionWelcomeDismissed: { [MAJOR_VERSION_FOR_CONTENT]: 123456 },
        notifyWhenRunCompletes: ['failed'],
      }),
      getAvailableEditors: sinon.stub(),
      setPreferences: sinon.stub(),
    } as unknown as LocalSettingsApiShape,
    authApi: {
      logIn: sinon.stub().throws('not stubbed'),
      resetAuthState: sinon.stub(),
    } as unknown as AuthApiShape,
    projectApi: {
      closeActiveProject: sinon.stub(),
      insertProjectToCache: sinon.stub().resolves(),
      getProjectRootsFromCache: sinon.stub().resolves([]),
      runSpec: sinon.stub(),
      routeToDebug: sinon.stub(),
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
    cohortsApi: {
      getCohorts: sinon.stub().resolves(),
      getCohort: sinon.stub().resolves(),
      insertCohort: sinon.stub(),
      determineCohort: sinon.stub().resolves(),
    } as unknown as CohortsApiShape,
  })

  const origFetch = ctx.util.fetch

  ctx.util.fetch = async function (url, init) {
    await new Promise((resolve) => setTimeout(resolve, 5))

    if (String(url).endsWith('/test-runner-graphql')) {
      const { query, variables } = JSON.parse(String(init?.body))
      const document = parse(query)
      const operationName = getOperationName(document)

      const result = await Promise.resolve(execute({
        operationName,
        variableValues: variables,
        rootValue: CloudQuery,
        contextValue: {
          __server__: ctx,
        },
        schema: remoteSchema,
        document,
      }))

      return new Response(JSON.stringify(result), { status: 200 })
    }

    return origFetch.call(this, url, init)
  }

  return ctx
}

export function createRelevantRun (runNumber: number): RelevantRunInfo {
  return {
    runNumber,
    ciBuildNumber: '123',
    branch: 'feature/branch',
    organizationId: 'org-id',
    sha: 'sha-123',
    totalFailed: 0,
  }
}

export function dedentWithOSLineWrap (literals: string|TemplateStringsArray, ...placeholders: any[]): string {
  return dedent(literals, ...placeholders).replace(/\n/g, os.EOL)
}
