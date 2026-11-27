// necessary to have mocha types working correctly
import { vi } from 'vitest'
import path from 'path'
import fs from 'fs-extra'
import { Response } from 'cross-fetch'
import type { fixtureDirs } from '@tooling/system-tests'
import Fixtures, { scaffoldProject, removeProject } from '@tooling/system-tests'
import type { DataContextConfig } from '../../src'
import { DataContext } from '../../src'
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
      getPreferences: vi.fn().mockResolvedValue({
        majorVersionWelcomeDismissed: { [GET_MAJOR_VERSION_FOR_CONTENT()]: 123456 },
        notifyWhenRunCompletes: ['failed'],
      }),
      getAvailableEditors: vi.fn(),
      setPreferences: vi.fn(),
    } as unknown as LocalSettingsApiShape,
    authApi: {
      logIn: vi.fn().mockImplementation(() => {
        throw new Error('not stubbed')
      }),
      signUp: vi.fn().mockImplementation(() => {
        throw new Error('not stubbed')
      }),
      resetAuthState: vi.fn(),
    } as unknown as AuthApiShape,
    projectApi: {
      setSessionLoadError: vi.fn().mockResolvedValue(undefined),
      clearSessionLoadError: vi.fn().mockResolvedValue(undefined),
      setSessionPluginsError: vi.fn(),
      closeActiveProject: vi.fn(),
      insertProjectToCache: vi.fn().mockResolvedValue(undefined),
      getProjectRootsFromCache: vi.fn().mockResolvedValue([]),
      runSpec: vi.fn(),
      routeToDebug: vi.fn(),
    } as unknown as ProjectApiShape,
    electronApi: {
      isMainWindowFocused: vi.fn().mockReturnValue(false),
      focusMainWindow: vi.fn(),
      copyTextToClipboard: (text: string) => {},
    } as unknown as ElectronApiShape,
    browserApi: {
      ensureAndGetByNameOrPath: vi.fn(),
      focusActiveBrowserWindow: vi.fn(),
      getBrowsers: vi.fn().mockResolvedValue([]),
    } as unknown as BrowserApiShape,
    cohortsApi: {
      getCohorts: vi.fn().mockResolvedValue(undefined),
      getCohort: vi.fn().mockResolvedValue(undefined),
      insertCohort: vi.fn(),
      determineCohort: vi.fn().mockResolvedValue(undefined),
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
