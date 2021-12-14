import { DataContext, getCtx, clearCtx, setCtx } from '@packages/data-context'
import electron from 'electron'
import pkg from '@packages/root'
import configUtils from '@packages/config'

import specsUtil from './util/specs'
import type { AllModeOptions, AllowedState, FindSpecs, FoundBrowser, InitializeProjectOptions, LaunchOpts, OpenProjectLaunchOptions, Preferences } from '@packages/types'
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
import appData from './util/app_data'
import plugins from './plugins'
import browsers from './browsers'

const { getBrowsers, ensureAndGetByNameOrPath } = browserUtils

interface MakeDataContextOptions {
  mode: 'run' | 'open'
  modeOptions: Partial<AllModeOptions>
}

export { getCtx, setCtx, clearCtx }

export function makeDataContext (options: MakeDataContextOptions): DataContext {
  const ctx = new DataContext({
    schema: graphqlSchema,
    ...options,
    browserApi: {
      close: browsers.close,
    },
    errorApi: {
      error: errors.get,
      message: errors.getMsgByType,
    },
    configApi: {
      getServerPluginHandlers: plugins.getServerPluginHandlers,
      allowedConfig: configUtils.allowed,
      cypressVersion: pkg.version,
      validateConfig: configUtils.validate,
      updateWithPluginValues: config.updateWithPluginValues,
      setupFullConfigWithDefaults: config.setupFullConfigWithDefaults,
    },
    appApi: {
      appData,
      getBrowsers,
      ensureAndGetByNameOrPath,
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
      launchProject (browser: FoundBrowser, spec: Cypress.Spec, options?: LaunchOpts) {
        return openProject.launch({ ...browser }, spec, options)
      },
      openProjectCreate (args: InitializeProjectOptions, options: OpenProjectLaunchOptions) {
        return openProject.create(args.projectRoot, args, options)
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
    electronApi: {
      openExternal (url: string) {
        openExternal(url)
      },
      showItemInFolder (folder: string) {
        electron.shell.showItemInFolder(folder)
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
  })

  return ctx
}
