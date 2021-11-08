import { DataContext } from '@packages/data-context'
import os from 'os'
import { app } from 'electron'

import specsUtil from './util/specs'
import type { FindSpecs, FoundBrowser, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions, PlatformName, Preferences, SettingsOptions } from '@packages/types'
import browserUtils from './browsers/utils'
import auth from './gui/auth'
import user from './user'
import * as config from './config'
import { EventEmitter } from 'events'
import { openProject } from './open_project'
import cache from './cache'
import errors from './errors'
import { graphqlSchema } from '@packages/graphql/src/schema'
import type { InternalDataContextOptions } from '@packages/data-context/src/DataContext'
import { openExternal } from '@packages/server/lib/gui/links'

const { getBrowsers, ensureAndGetByNameOrPath } = browserUtils

interface MakeDataContextOptions {
  os: PlatformName
  rootBus: EventEmitter
  launchArgs: LaunchArgs
  _internalOptions: InternalDataContextOptions
}

let legacyDataContext: DataContext | undefined

// For testing
export function clearLegacyDataContext () {
  legacyDataContext = undefined
}

export function makeLegacyDataContext (launchArgs: LaunchArgs = {} as LaunchArgs): DataContext {
  if (legacyDataContext && process.env.LAUNCHPAD) {
    throw new Error(`Expected ctx to be passed as an arg, but used legacy data context`)
  } else if (!legacyDataContext) {
    legacyDataContext = makeDataContext({
      rootBus: new EventEmitter,
      launchArgs,
      os: os.platform() as PlatformName,
      _internalOptions: {
        loadCachedProjects: true,
      },
    })
  }

  return legacyDataContext
}

export function makeDataContext (options: MakeDataContextOptions) {
  return new DataContext({
    schema: graphqlSchema,
    ...options,
    launchOptions: {},
    electronApp: app,
    appApi: {
      getBrowsers,
      ensureAndGetByNameOrPath,
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
        return config.get(projectRoot, options)
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
      error (type: string, ...args: any) {
        throw errors.throw(type, ...args)
      },
    },
    electronApi: {
      openExternal (url: string) {
        openExternal(url)
      },
    },
  })
}
