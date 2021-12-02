import { DataContext } from '@packages/data-context'
import os from 'os'
import specsUtil from './util/specs'
import type {
  FindSpecs,
  FoundBrowser,
  LaunchArgs,
  LaunchOpts,
  PlatformName,
  Preferences,
  AllowedState,
  CypressErrorIdentifier,
} from '@packages/types'
import browserUtils from './browsers/utils'
import auth from './gui/auth'
import user from './user'
import cache from './cache'
import errors from './errors'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { openExternal } from '@packages/server/lib/gui/links'
import { getUserEditor } from './util/editors'
import * as savedState from './saved_state'
import { OpenProject } from './open_project'
import app_data from './util/app_data'
import plugins from './plugins'

const { getBrowsers, ensureAndGetByNameOrPath } = browserUtils

interface MakeDataContextOptions {
  mode: 'run' | 'open'
  options: Partial<LaunchArgs>
}

export function testOpenCtx (projectRoot: string, options?: Partial<LaunchArgs>) {
  return makeDataContext({
    mode: 'open',
    options: {
      projectRoot,
      testingType: 'e2e',
      ...options,
    },
  })
}

export function testRunCtx (projectRoot: string, options?: Partial<LaunchArgs>) {
  return makeDataContext({
    mode: 'run',
    options: {
      projectRoot,
      testingType: 'e2e',
      ...options,
    },
  })
}

let lastSeenCtx: DataContext | null = null

export function getCtx () {
  return lastSeenCtx
}

export async function clearLastSeenCtx () {
  await lastSeenCtx?.destroy()

  lastSeenCtx = null
}

export function makeDataContext (options: MakeDataContextOptions): DataContext {
  let ctx: DataContext

  // Hacks to get around TypeScript & all of the injection we're doing here.
  // Remove when we refactor to the data-context layer
  function legacyOpenProject () {
    return ctx.legacyOpenProject as OpenProject
  }

  ctx = new DataContext({
    os: os.platform() as PlatformName,
    schema: graphqlSchema,
    ...options,
    launchArgs: options.options ?? {},
    apis: {
      browserApi: {},
      appDataApi: app_data,
      appApi: {
        errorString (key: CypressErrorIdentifier, ...args: any[]) {
          return errors.getMsgByType(key, ...args)
        },
        warn (key: CypressErrorIdentifier, ...args: any[]) {
          errors.warning(key, ...args)
        },
        error (key: CypressErrorIdentifier, ...args: any[]) {
          return errors.get(key, ...args)
        },
        getBrowsers,
        ensureAndGetByNameOrPath (nameOrPath, browsers) {
          return ensureAndGetByNameOrPath(nameOrPath, false, browsers as FoundBrowser[]) as Promise<FoundBrowser>
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
        getPluginIpcHandlers: plugins.getPluginIpcHandlers,
        makeLegacyOpenProject () {
          return new OpenProject(ctx)
        },
        launchProject (browser: FoundBrowser, spec: Cypress.Spec, options?: LaunchOpts) {
          return legacyOpenProject().launch({ ...browser }, spec, options)
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
          return legacyOpenProject().closeActiveProject()
        },
        saveState (state) {
          // let state = await savedState.create(this.projectRoot, this.cfg.isTextTerminal)

          // state.set(stateChanges)
          // this.cfg.state = await state.get()

          // return this.cfg.state
        },
      },
      electronApi: {
        openExternal (url: string) {
          openExternal(url)
        },
        showItemInFolder (folder: string) {
          require('electron').shell.showItemInFolder(folder)
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
    },
  })

  lastSeenCtx = ctx

  return ctx
}
