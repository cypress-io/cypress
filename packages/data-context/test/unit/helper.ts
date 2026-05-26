// necessary to have mocha types working correctly
import { jest } from '@jest/globals'
import path from 'path'
import fs from 'fs-extra'
import { Response } from 'cross-fetch'
import Fixtures, { fixtureDirs, scaffoldProject, removeProject } from '@tooling/system-tests'
import { DataContext, DataContextConfig } from '../../src'
import { graphqlSchema } from '../../graphql/schema'
import { remoteSchemaWrapped as schemaCloud } from '../../graphql/stitching/remoteSchemaWrapped'
import type { BrowserApiShape } from '../../src/sources/BrowserDataSource'
import type { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape, CohortsApiShape } from '../../src/actions'
import { execute, parse } from 'graphql'
import { getOperationName } from '@urql/core'
import { CloudQuery } from '../../test/graphql/stubCloudTypes'
import { remoteSchema } from '../../graphql/stitching/remoteSchema'
import type { OpenModeOptions, RunModeOptions } from '@packages/types'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import type { RelevantRunInfo } from '../../src/gen/graphcache-config.gen'

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
      getPreferences: jest.fn().mockResolvedValue({
        majorVersionWelcomeDismissed: { [GET_MAJOR_VERSION_FOR_CONTENT()]: 123456 },
        notifyWhenRunCompletes: ['failed'],
      }),
      getAvailableEditors: jest.fn(),
      setPreferences: jest.fn(),
    } as unknown as LocalSettingsApiShape,
    authApi: {
      logIn: jest.fn().mockImplementation(() => {
        throw new Error('not stubbed')
      }),
      signUp: jest.fn().mockImplementation(() => {
        throw new Error('not stubbed')
      }),
      resetAuthState: jest.fn(),
    } as unknown as AuthApiShape,
    projectApi: {
      closeActiveProject: jest.fn(),
      insertProjectToCache: jest.fn().mockResolvedValue(undefined),
      getProjectRootsFromCache: jest.fn().mockResolvedValue([]),
      runSpec: jest.fn(),
      routeToDebug: jest.fn(),
    } as unknown as ProjectApiShape,
    electronApi: {
      isMainWindowFocused: jest.fn().mockReturnValue(false),
      focusMainWindow: jest.fn(),
      copyTextToClipboard: (text: string) => {},
    } as unknown as ElectronApiShape,
    browserApi: {
      ensureAndGetByNameOrPath: jest.fn(),
      focusActiveBrowserWindow: jest.fn(),
      getBrowsers: jest.fn().mockResolvedValue([]),
    } as unknown as BrowserApiShape,
    cohortsApi: {
      getCohorts: jest.fn().mockResolvedValue(undefined),
      getCohort: jest.fn().mockResolvedValue(undefined),
      insertCohort: jest.fn(),
      determineCohort: jest.fn().mockResolvedValue(undefined),
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
    // @ts-expect-error - ciBuildNumber is not in the type
    ciBuildNumber: '123',
    branch: 'feature/branch',
    organizationId: 'org-id',
    sha: 'sha-123',
    totalFailed: 0,
  }
}
