import { DataContext } from '@packages/data-context'
import os from 'os'
import electron, { App } from 'electron'

import specsUtil from './util/specs'
import type {
  Editor,
  FindSpecs,
  FoundBrowser,
  LaunchArgs,
  LaunchOpts,
  OpenProjectLaunchOptions,
  PlatformName,
  Preferences,
  SettingsOptions,
  CypressError,
  CypressErrorLike,
  CypressErrorIdentifier,
} from '@packages/types'
import browserUtils from './browsers/utils'
import auth from './gui/auth'
import user from './user'
import * as config from './config'
import { EventEmitter } from 'events'
import { openProject } from './open_project'
import cache from './cache'
import errors from './errors'
import findSystemNode from './util/find_system_node'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { openExternal } from '@packages/server/lib/gui/links'
import app_data from './util/app_data'
import { getDevicePreferences, setDevicePreference } from './util/device_preferences'
import { getUserEditor, setUserEditor } from './util/editors'

const { getBrowsers, ensureAndGetByNameOrPath } = browserUtils

interface MakeDataContextOptions {
  mode: 'run' | 'open'
  electronApp?: App
  os: PlatformName
  rootBus: EventEmitter
  launchArgs: LaunchArgs
}

let legacyDataContext: DataContext | undefined

// For testing
export async function clearLegacyDataContext () {
  await legacyDataContext?.destroy()
  legacyDataContext = undefined
}

export function makeLegacyDataContext (launchArgs: LaunchArgs = {} as LaunchArgs, mode: 'open' | 'run' = 'run'): DataContext {
  if (legacyDataContext && process.env.LAUNCHPAD) {
    throw new Error(`Expected ctx to be passed as an arg, but used legacy data context`)
  } else if (!legacyDataContext) {
    legacyDataContext = makeDataContext({
      mode,
      rootBus: new EventEmitter,
      launchArgs,
      os: os.platform() as PlatformName,
    })
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
  const ctx = new DataContext({
    schema: graphqlSchema,
    ...options,
    launchOptions: {},
    appApi: {
      getBrowsers,
      ensureAndGetByNameOrPath (nameOrPath: string, browsers: ReadonlyArray<FoundBrowser>) {
        return ensureAndGetByNameOrPath(nameOrPath, false, browsers as FoundBrowser[]) as Promise<FoundBrowser>
      },
      findNodePath () {
        return findSystemNode.findNodeInFullPath()
      },
    },
    appDataApi: app_data,
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
      initializeProject (args: LaunchArgs, options: OpenProjectLaunchOptions<DataContext>, browsers: FoundBrowser[]) {
        return openProject.create(args.projectRoot, args, options, browsers).then((p) => {
          return (p.getConfig()?.browsers ?? []) as FoundBrowser[]
        })
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
      error (type: CypressErrorIdentifier, ...args: any[]) {
        return errors.get(type, ...args) as CypressError | CypressErrorLike
      },
    },
    electronApi: {
      openExternal (url: string) {
        return openExternal(url)
      },
      showItemInFolder (folder: string) {
        electron.shell.showItemInFolder(folder)
      },
    },
    localSettingsApi: {
      setDevicePreference (key, value) {
        return setDevicePreference(key, value)
      },

      async getPreferences () {
        return getDevicePreferences()
      },
      async setPreferredOpener (editor: Editor) {
        await setUserEditor(editor)
      },
      async getAvailableEditors () {
        const { availableEditors } = await getUserEditor(true)

        return availableEditors
      },
    },
  })

  return ctx
}
