import { DataContext } from '@packages/data-context'
import specsUtil from './util/specs'
import type { FindSpecs, FoundBrowser, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions, PlatformName, Preferences } from '@packages/types'
import browserUtils from './browsers/utils'
import auth from './gui/auth'
import user from './user'
import * as config from './config'
import type { EventEmitter } from 'events'
import { openProject } from './open_project'
import cache from './cache'

const { getBrowsers } = browserUtils

interface MakeDataContextOptions {
  os: PlatformName
  rootBus: EventEmitter
  launchArgs: LaunchArgs
}

export function makeDataContext (options: MakeDataContextOptions) {
  return new DataContext({
    ...options,
    launchOptions: {},
    appApi: {
      getBrowsers () {
        return getBrowsers()
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
      getConfig (projectRoot: string) {
        return config.get(projectRoot)
      },
      getCurrentProjectSavedState () {
        return openProject.getConfig()?.state
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
    },
  })
}
