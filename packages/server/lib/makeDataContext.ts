import { DataContext, getCtx, clearCtx, setCtx } from '@packages/data-context'
import electron, { OpenDialogOptions, SaveDialogOptions, BrowserWindow } from 'electron'
import pkg from '@packages/root'
import configUtils from '@packages/config'

import type {
  AllModeOptions,
  AllowedState,
  FoundBrowser,
  InitializeProjectOptions,
  LaunchOpts,
  OpenProjectLaunchOptions,
  Preferences,
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
import appData from './util/app_data'
import plugins from './plugins'
import browsers from './browsers'
import devServer from './plugins/dev-server'

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
      getBrowsers,
      async ensureAndGetByNameOrPath (nameOrPath: string) {
        const browsers = await ctx.browser.machineBrowsers()

        return await ensureAndGetByNameOrPath(nameOrPath, false, browsers)
      },
      async focusActiveBrowserWindow () {
        return openProject.projectBase?.sendFocusBrowserMessage()
      },
    },
    errorApi: {
      error: errors.get,
      message: errors.getMsgByType,
      warning: errors.warning,
    },
    configApi: {
      getServerPluginHandlers: plugins.getServerPluginHandlers,
      allowedConfig: configUtils.allowed,
      cypressVersion: pkg.version,
      validateConfig: configUtils.validate,
      updateWithPluginValues: config.updateWithPluginValues,
      setupFullConfigWithDefaults: config.setupFullConfigWithDefaults,
      validateRootConfigBreakingChanges: configUtils.validateNoBreakingConfigRoot,
    },
    appApi: {
      appData,
      findNodePath () {
        return findSystemNode.findNodeInFullPath()
      },
    },
    authApi: {
      getUser () {
        return user.get()
      },
      logIn (onMessage) {
        const windows = require('./gui/windows')
        const originalIsMainWindowFocused = windows.isMainWindowFocused()
        const onLogin = async () => {
          if (originalIsMainWindowFocused || !ctx.browser.isFocusSupported(ctx.coreData.chosenBrowser)) {
            windows.focusMainWindow()
          } else {
            await ctx.actions.browser.focusActiveBrowserWindow()
          }
        }

        return auth.start(onMessage, 'launchpad', onLogin)
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
        return cache.insertProject(projectRoot)
      },
      getProjectRootsFromCache () {
        return cache.getProjectRoots()
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
      getConfig () {
        return openProject.getConfig()
      },
      getCurrentProjectSavedState () {
        // TODO: See if this is the best way we should be getting this config,
        // shouldn't we have this already in the DataContext?
        try {
          return openProject.getConfig()?.state
        } catch {
          return {}
        }
      },
      setPromptShown (slug) {
        return openProject.getProject()
        ?.saveState({
          promptsShown: {
            ...(openProject.getProject()?.state?.promptsShown ?? {}),
            [slug]: Date.now(),
          },
        })
      },
      getDevServer () {
        return devServer
      },
    },
    electronApi: {
      openExternal (url: string) {
        openExternal(url).catch((e) => {
          ctx.logTraceError(e)
        })
      },
      showItemInFolder (folder: string) {
        electron.shell.showItemInFolder(folder)
      },
      showOpenDialog (props: OpenDialogOptions) {
        return electron.dialog.showOpenDialog(props)
      },
      showSaveDialog (window: BrowserWindow, props: SaveDialogOptions) {
        return electron.dialog.showSaveDialog(window, props)
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
