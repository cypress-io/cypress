import { DataContext, getCtx, clearCtx, setCtx } from '@packages/data-context'
import type { OpenDialogOptions, SaveDialogOptions, BrowserWindow } from 'electron'
import pkg from '@packages/root'
import * as configUtils from '@packages/config'
import { isListening } from './util/ensure-url'

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
import findSystemNode from './util/find_system_node'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { openExternal } from '@packages/server/lib/gui/links'
import { getUserEditor } from './util/editors'
import * as savedState from './saved_state'
import appData from './util/app_data'
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
        return openProject.sendFocusBrowserMessage()
      },
      relaunchBrowser () {
        return openProject.relaunchBrowser ? openProject.relaunchBrowser() : null
      },
    },
    configApi: {
      allowedConfig: configUtils.allowed,
      cypressVersion: pkg.version,
      validateConfig: configUtils.validate,
      updateWithPluginValues: config.updateWithPluginValues,
      setupFullConfigWithDefaults: config.setupFullConfigWithDefaults,
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
      logIn (onMessage, utmCode) {
        return auth.start(onMessage, utmCode)
      },
      logOut () {
        return user.logOut()
      },
      resetAuthState () {
        auth.stopServer()
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
        // FIXME: this should be awaited (since it writes to disk asynchronously) but is not
        // https://cypress-io.atlassian.net/browse/UNIFY-1705
        cache.insertProjectPreferences(projectTitle, preferences)
      },
      removeProjectFromCache (path: string) {
        return cache.removeProject(path)
      },
      closeActiveProject () {
        return openProject.closeActiveProject()
      },
      getCurrentBrowser () {
        return (openProject?.projectBase?.browser) ?? undefined
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
      isListening,
    },
    electronApi: {
      openExternal (url: string) {
        openExternal(url).catch((e) => {
          ctx.logTraceError(e)
        })
      },
      showItemInFolder (folder: string) {
        require('electron').shell.showItemInFolder(folder)
      },
      showOpenDialog (props: OpenDialogOptions) {
        return require('electron').dialog.showOpenDialog(props)
      },
      showSaveDialog (window: BrowserWindow, props: SaveDialogOptions) {
        return require('electron').dialog.showSaveDialog(window, props)
      },
      copyTextToClipboard (text: string) {
        require('electron').clipboard.writeText(text)
      },
      // These instances of JIT requiring gui/windows can be removed
      // once https://github.com/cypress-io/cypress/issues/21236 is fixed
      isMainWindowFocused () {
        return require('./gui/windows').isMainWindowFocused()
      },
      focusMainWindow () {
        return require('./gui/windows').focusMainWindow()
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
