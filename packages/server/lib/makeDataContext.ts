import { DataContext, getCtx, clearCtx, setCtx } from '@packages/data-context'
// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import electron, { OpenDialogOptions, SaveDialogOptions, BrowserWindow } from 'electron'

import { isListening } from './util/ensure-url'
import { isMainWindowFocused, focusMainWindow } from './gui/windows'

import type {
  AllModeOptions,
  AllowedState,
  OpenProjectLaunchOpts,
  FoundBrowser,
  InitializeProjectOptions,
  OpenProjectLaunchOptions,
  Preferences,
} from '@packages/types'

import browserUtils from './browsers/utils'
import auth from './cloud/auth'
import user from './cloud/user'
import cohorts from './cohorts'
import { openProject } from './open_project'
import cache from './cache'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { openExternal } from './gui/links'
import { getUserEditor } from './util/editors'
import * as savedState from './saved_state'
import appData from './util/app_data'
import browsers from './browsers'
import devServer from './plugins/dev-server'
import { remoteSchemaWrapped } from '@packages/graphql'

const { getBrowsers, ensureAndGetByNameOrPath } = browserUtils

interface MakeDataContextOptions {
  mode: 'run' | 'open'
  modeOptions: Partial<AllModeOptions>
}

export { getCtx, setCtx, clearCtx }

export function makeDataContext (options: MakeDataContextOptions): DataContext {
  const ctx = new DataContext({
    schema: graphqlSchema,
    schemaCloud: remoteSchemaWrapped,
    ...options,
    browserApi: {
      close: browsers.close,
      getBrowsers,
      async ensureAndGetByNameOrPath (nameOrPath: string) {
        const browsers = await ctx.browser.allBrowsers()

        return await ensureAndGetByNameOrPath(nameOrPath, false, browsers)
      },
      async focusActiveBrowserWindow () {
        return openProject.sendFocusBrowserMessage()
      },
      async relaunchBrowser () {
        await openProject.relaunchBrowser()
      },
    },
    appApi: {
      appData,
    },
    authApi: {
      getUser () {
        return user.get()
      },
      logIn (onMessage, utmSource, utmMedium, utmContent) {
        return auth.start(onMessage, utmSource, utmMedium, utmContent)
      },
      logOut () {
        return user.logOut()
      },
      resetAuthState () {
        auth.stopServer()
      },
    },
    projectApi: {
      async launchProject (browser: FoundBrowser, spec: Cypress.Spec, options: OpenProjectLaunchOpts) {
        await openProject.launch({ ...browser }, spec, options)
      },
      openProjectCreate (args: InitializeProjectOptions, options: OpenProjectLaunchOptions) {
        return openProject.create(args.projectRoot, args, options)
      },
      insertProjectToCache (projectRoot: string) {
        return cache.insertProject(projectRoot)
      },
      async getProjectRootsFromCache () {
        return cache.getProjectRoots().then((roots) => {
          return Promise.all(roots.map(async (projectRoot: string) => {
            return {
              projectRoot,
              savedState: () => savedState.create(projectRoot).then((s) => s.get()),
            }
          }))
        })
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
        return (openProject?.getProject()?.browser) ?? undefined
      },
      getConfig () {
        return openProject.getConfig()
      },
      getRemoteStates () {
        return openProject.getRemoteStates()
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
      setProjectPreferences (state) {
        return openProject.getProject()?.saveState(state)
      },
      makeProjectSavedState (projectRoot: string) {
        return () => savedState.create(projectRoot).then((s) => s.get())
      },
      getDevServer () {
        return devServer
      },
      isListening,
      resetBrowserTabsForNextSpec (shouldKeepTabOpen: boolean) {
        return openProject.resetBrowserTabsForNextSpec(shouldKeepTabOpen)
      },
      resetServer () {
        return openProject.getProject()?.server.reset()
      },
      async runSpec (spec: Cypress.Spec): Promise<void> {
        openProject.changeUrlToSpec(spec)
      },
      routeToDebug (runNumber: number) {
        openProject.changeUrlToDebug(runNumber)
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
      copyTextToClipboard (text: string) {
        electron.clipboard.writeText(text)
      },
      isMainWindowFocused () {
        return isMainWindowFocused()
      },
      focusMainWindow () {
        return focusMainWindow()
      },
      createNotification (title, body) {
        return new electron.Notification({ title, body })
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
    cohortsApi: {
      async getCohorts () {
        return cohorts.get()
      },
      async getCohort (name: string) {
        return cohorts.getByName(name)
      },
      async insertCohort (cohort) {
        cohorts.set(cohort)
      },
    },
  })

  return ctx
}
