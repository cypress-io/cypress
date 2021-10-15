import { DataContext } from '@packages/data-context'
import specsUtil from './util/specs'
import type { Cache, FindSpecs, FoundBrowser, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions, PlatformName } from '@packages/types'
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
      getConfig (projectRoot: string) {
        return config.get(projectRoot)
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
      clearProjectPreferences () {
        return cache.removeProjectPreferences()
      },
      removeProjectFromCache (path: string) {
        return cache.removeProject(path)
      },
      closeActiveProject () {
        return openProject.closeOpenProjectAndBrowsers()
      },
      readCache (): Promise<Cache> {
        return cache.read()
      },
      writeCache (item: Partial<Cache>) {
        return cache.write(item)
      },
    },
  })
}
