import { DataContext } from '@packages/data-context'
import specsUtil from './util/specs'
import type { FindSpecs, FoundBrowser, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions, PlatformName, Preferences, ProjectConfigCache, SettingsOptions } from '@packages/types'
import { checkAuthQuery } from '@packages/graphql/src/stitching/remoteGraphQLCalls'
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
      logIn (onMessage) {
        return auth.start(onMessage, 'launchpad')
      },
      logOut () {
        return user.logOut()
      },
      checkAuth (context) {
        return checkAuthQuery(context)
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
      setProjectConfig (projectRoot: string, config: Partial<ProjectConfigCache> | null) {
        return cache.setProjectConfig(projectRoot, config)
      },
      getProjectConfig (projectRoot: string) {
        return cache.getProjectConfig(projectRoot)
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
