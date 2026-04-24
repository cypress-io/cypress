import { DataContext, getCtx, clearCtx, setCtx } from '@packages/data-context'
import type { AutInspectDomRunnerPayload, AutInspectRootRunnerPayload, AutInspectSnapshotRunnerPayload } from '@packages/data-context/src/data/coreDataShape'
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
import * as cohorts from './cohorts'
import { openProject } from './open_project'
import { cache } from './cache'
import { graphqlSchema } from '@packages/data-context/graphql/schema'
import { openExternal } from './gui/links'
import { getUserEditor } from './util/editors'
import * as savedState from './saved_state'
import appData from './util/app_data'
import browsers from './browsers'
import devServer from './plugins/dev-server'
import { remoteSchemaWrapped } from '@packages/data-context/graphql'

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
        return cache.insertProjectPreferences(projectTitle, preferences)
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
      emitStudioInitTest (testId: string) {
        // Mirrors the reporter "Edit in Studio" button: the browser-side
        // EventManager listens for `studio:remote-init:test` and calls the
        // same local handler used for the reporter-emitted `studio:init:test`.
        openProject.getProject()?.server.socket.toRunner('studio:remote-init:test', { testId })
      },
      emitStudioCancel () {
        // Mirrors the reporter Studio cancel button: browser-side EventManager
        // runs the same `executeStudioCancel` that tears down the Studio panel
        // and asks the server to destroy `StudioLifecycleManager`.
        openProject.getProject()?.server.socket.toRunner('studio:remote-cancel')
      },
      async requestCommandsSnapshot (testId: string) {
        // Asks the runner for a snapshot of the reporter's command log for
        // `testId`. The runner reads from its MobX store and replies via the
        // socket ack — see `packages/reporter/src/lib/events.ts`.
        const socket = openProject.getProject()?.server.socket

        if (!socket?.requestRunner) {
          return null
        }

        const response = await socket.requestRunner('inspect:request-commands', { testId }, 1500)

        return Array.isArray(response) ? response : null
      },
      emitPinCommand (testId: string, logId: string) {
        // Mirrors clicking the pin icon on a command in the reporter. The
        // browser-side EventManager listens for this event and runs the same
        // handler path as `_toggleColumnPin` in `reporter/src/commands/command.tsx`.
        openProject.getProject()?.server.socket.toRunner('inspect:remote-pin-command', { testId, logId })
      },
      emitUnpinCommand () {
        openProject.getProject()?.server.socket.toRunner('inspect:remote-unpin-command')
      },
      async requestPinnedCommand (testId: string) {
        // Asks the runner which command (if any) is currently pinned, and for
        // a safe-stringified dump of its `consoleProps`. The runner-side
        // handler bridges the reporter's `appState.pinnedSnapshotId` to the
        // driver's `getConsolePropsForLog`.
        const socket = openProject.getProject()?.server.socket

        if (!socket?.requestRunner) {
          return null
        }

        const response = await socket.requestRunner('inspect:request-pinned-command', { testId }, 1500)

        if (!response || typeof response !== 'object') {
          return null
        }

        const pinned = response as { logId?: unknown, consolePropsJson?: unknown }

        if (typeof pinned.logId !== 'string') {
          return null
        }

        return {
          testId,
          logId: pinned.logId,
          consolePropsJson: typeof pinned.consolePropsJson === 'string' ? pinned.consolePropsJson : null,
        }
      },
      async requestCommandConsoleProps (testId: string, logIds: string[]) {
        // Read-only sibling of `requestPinnedCommand`: asks the runner to dump
        // `consoleProps` for each of `logIds` without touching the reporter's
        // pin state. One round-trip per call, fan-out happens runner-side.
        const socket = openProject.getProject()?.server.socket

        if (!socket?.requestRunner) {
          return null
        }

        const response = await socket.requestRunner('inspect:request-command-console-props', { testId, logIds }, 1500)

        if (!Array.isArray(response)) {
          return null
        }

        return response.map((entry: any) => ({
          logId: typeof entry?.logId === 'string' ? entry.logId : '',
          consolePropsJson: typeof entry?.consolePropsJson === 'string' ? entry.consolePropsJson : null,
        })).filter((entry) => entry.logId !== '')
      },
      async requestAutInspectRoot () {
        // Round-trip to the runner for url/title/viewport of the AUT iframe.
        // The runner applies any needed truncation (N/A here) — we pass the
        // payload through unchanged. See `packages/app/src/runner/event-manager.ts`
        // for the handler.
        const socket = openProject.getProject()?.server.socket

        if (!socket?.requestRunner) {
          return null
        }

        const response = await socket.requestRunner('inspect:request-aut', { kind: 'root', args: {} }, 1500)

        if (!response || typeof response !== 'object') {
          return null
        }

        return response as AutInspectRootRunnerPayload
      },
      async requestAutInspectDom (selector: string) {
        // Round-trip to the runner for a CSS-selector query against the AUT
        // DOM. Truncation caps (20 matches, 500-char text, 2048-char outerHTML)
        // are applied runner-side.
        const socket = openProject.getProject()?.server.socket

        if (!socket?.requestRunner) {
          return null
        }

        const response = await socket.requestRunner('inspect:request-aut', { kind: 'dom', args: { selector } }, 1500)

        if (!response || typeof response !== 'object') {
          return null
        }

        return response as AutInspectDomRunnerPayload
      },
      async requestAutInspectSnapshot () {
        // Round-trip to the runner for an accessibility-tree snapshot of the
        // AUT. Walker caps (500 nodes) are applied runner-side. Timeout is
        // raised vs. the other verbs because the tree walk is O(DOM).
        const socket = openProject.getProject()?.server.socket

        if (!socket?.requestRunner) {
          return null
        }

        const response = await socket.requestRunner('inspect:request-aut', { kind: 'snapshot', args: {} }, 3000)

        if (!response || typeof response !== 'object') {
          return null
        }

        return response as AutInspectSnapshotRunnerPayload
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
