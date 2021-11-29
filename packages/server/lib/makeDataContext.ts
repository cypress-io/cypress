import { DataContext } from '@packages/data-context'
import os from 'os'
import specsUtil from './util/specs'
import type {
  FindSpecs,
  FoundBrowser,
  LaunchArgs,
  LaunchOpts,
  OpenProjectLaunchOptions,
  PlatformName,
  Preferences,
  SettingsOptions,
  AllowedState,
} from '@packages/types'
import browserUtils from './browsers/utils'
import auth from './gui/auth'
import user from './user'
import * as config from './config'
import { openProject } from './open_project'
import cache from './cache'
import errors from './errors'
import findSystemNode from './util/find_system_node'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { openExternal } from '@packages/server/lib/gui/links'
import { getUserEditor } from './util/editors'
import * as savedState from './saved_state'

const { getBrowsers, ensureAndGetByNameOrPath } = browserUtils

interface MakeDataContextOptions {
  mode: 'run' | 'open'
  launchArgs?: Partial<LaunchArgs>
}

let legacyDataContext: DataContext | undefined

// For testing
export async function clearLegacyDataContext () {
  await legacyDataContext?.destroy()
  legacyDataContext = undefined
}

export function makeLegacyDataContext (options: MakeDataContextOptions = { mode: 'run' }): DataContext {
  if (legacyDataContext && process.env.LAUNCHPAD) {
    throw new Error(`Expected ctx to be passed as an arg, but used legacy data context`)
  } else if (!legacyDataContext) {
    legacyDataContext = makeDataContext(options)
  }

  return legacyDataContext
}

export function getLegacyDataContext () {
  if (!legacyDataContext) {
    throw new Error(`legacyDataContext`)
  }

  return legacyDataContext
}

export function makeDataContext (options: MakeDataContextOptions): DataContext {
  let ctx: DataContext

  ctx = new DataContext({
    os: os.platform() as PlatformName,
    schema: graphqlSchema,
    ...options,
    launchArgs: options.launchArgs ?? {},
    launchOptions: {},
    apis: {
      appApi: {
        getBrowsers,
        ensureAndGetByNameOrPath (nameOrPath, browsers) {
          return ensureAndGetByNameOrPath(nameOrPath, false, browsers as FoundBrowser[]) as Promise<FoundBrowser>
        },
        findNodePath () {
          return findSystemNode.findNodeInFullPath()
        },
      },
      authApi: {
        getUser () {
          return user.get()
        },
        logIn (onMessage) {
          return auth.start(onMessage, 'launchpad')
        },
        logOut () {
          return user.logOut()
        },
      },
      projectApi: {
        getConfig (projectRoot: string, options?: SettingsOptions) {
          return config.get(projectRoot, options, ctx)
        },
        launchProject (browser: FoundBrowser, spec: Cypress.Spec, options?: LaunchOpts) {
          return openProject.launch({ ...browser }, spec, options)
        },
        initializeProject (args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: FoundBrowser[]) {
          return openProject.create(args.projectRoot, args, options, browsers)
        },
        insertProjectToCache (projectRoot: string) {
          cache.insertProject(projectRoot)
        },
        getProjectRootsFromCache () {
          return cache.getProjectRoots()
        },
        findSpecs (payload: FindSpecs) {
          return specsUtil.findSpecs(payload)
        },
        clearLatestProjectsCache () {
          return cache.removeLatestProjects()
        },
        getProjectPreferencesFromCache () {
          return cache.getProjectPreferences()
        },
        clearProjectPreferences (projectTitle: string) {
          return cache.removeProjectPreferences(projectTitle)
        },
        clearAllProjectPreferences () {
          return cache.removeAllProjectPreferences()
        },
        insertProjectPreferencesToCache (projectTitle: string, preferences: Preferences) {
          cache.insertProjectPreferences(projectTitle, preferences)
        },
        removeProjectFromCache (path: string) {
          return cache.removeProject(path)
        },
        closeActiveProject () {
          return openProject.closeActiveProject()
        },
        get error () {
          return errors
        },
      },
      electronApi: {
        openExternal (url: string) {
          openExternal(url)
        },
        showItemInFolder (folder: string) {
          require('electron').shell.showItemInFolder(folder)
        },
      },
      localSettingsApi: {
        async setPreferences (object: AllowedState) {
          const state = await savedState.create()

          return state.set(object)
        },
        async getPreferences () {
          return (await savedState.create()).get()
        },
        async getAvailableEditors () {
          const { availableEditors } = await getUserEditor(true)

          return availableEditors
        },
      },
    },
  })

  return ctx
}
