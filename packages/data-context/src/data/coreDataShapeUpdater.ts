import assert from 'assert'
import { castDraft, Draft, enablePatches, Patch, produceWithPatches } from 'immer'
import { buildFullConfig, CurrentProjectDataShape } from '.'
import type { DataContext } from '..'
import type { LoadingState } from '../util'
import { buildSetupNodeEventsConfig } from './configBuilder'
import type { CoreDataShape } from './coreDataShape'

enablePatches()

export type Updater = (proj: Draft<CoreDataShape>) => void | undefined | CoreDataShape

let withinUpdate = false
let currentDraft: Draft<CoreDataShape> | undefined

function produceWithPatchesWithinDraft (initial: CoreDataShape, updater: Updater) {
  return produceWithPatches(initial, (d) => {
    currentDraft = d
    updater(d)
    currentDraft = undefined
  })
}

/**
 * Splitting this out from the DataContext to act as the central dispatch mechanism
 * for state changes in the application.
 *
 * Whenever the immutable state object updates, we can take actions based on that
 * state change to automatically maintain a consistent state within the application.
 */
export function coreDataShapeUpdater (ctx: DataContext, updater: Updater): { coreData: CoreDataShape, patches: Patch[] } | undefined {
  if (withinUpdate && !currentDraft) {
    throw new Error(`Cannot call coreDataShapeUpdater recursively, saw ${updater.toString()}`)
  } else if (currentDraft) {
    updater(currentDraft)

    return undefined
  }

  withinUpdate = true
  try {
    return _coreDataShapeUpdater(ctx, updater)
  } catch (e) {
    const [coreData, patches] = produceWithPatches(ctx.coreData, (s) => {
      s.globalError = ctx.prepError(e)
    })

    return { coreData, patches }
  } finally {
    currentDraft = undefined
    withinUpdate = false
  }
}

/**
 * Internal updater for the core state shape. We issue the `updater` called from elsewhere in the codebase,
 * and then based on the `nextState` decide whether we need to kick off any of the async loading manager
 * processes which will help us with any derived final state.
 */
function _coreDataShapeUpdater (ctx: DataContext, updater: Updater): { coreData: CoreDataShape, patches: Patch[] } {
  const initialState = ctx.coreData

  // Use the updater to change the internal state
  let [nextState, patches] = produceWithPatches(initialState, updater)

  if (nextState === initialState) {
    return {
      coreData: nextState,
      patches,
    }
  }

  if (nextState.derived !== initialState.derived) {
    throw new Error(`Cannot update derived state directly, saw updates for ${patches.map((p) => p.path)}`)
  }

  type LoadableKeys<T> = Exclude<{[K in keyof T]: T[K] extends LoadingState<any> ? K : never}[keyof T], undefined>

  const hasChanged = (k: LoadableKeys<CoreDataShape>) => initialState[k] !== nextState[k]
  const hasLoaded = (k: LoadableKeys<CoreDataShape>) => nextState[k].state === 'LOADED'
  const hasChangedProject = (k: LoadableKeys<CurrentProjectDataShape> | 'currentTestingType') => {
    return initialState.currentProject?.[k] !== nextState.currentProject?.[k]
  }
  const hasLoadedProject = (k: LoadableKeys<CurrentProjectDataShape> | 'currentTestingType') => {
    if (k === 'currentTestingType') {
      return Boolean(nextState.currentProject?.currentTestingType)
    }

    return nextState.currentProject?.[k].state === 'LOADED'
  }

  // When we've changed the projectRoot, we need to cleanup all state management associated
  // with the project, and load the state for the new project if we have one.
  if (initialState.currentProject?.projectRoot !== nextState.currentProject?.projectRoot) {
    const [updatedState, _patches] = produceWithPatchesWithinDraft(nextState, (s) => {
      if (s.currentProject?.legacyOpenProject) {
        s.currentProject.legacyOpenProject?.close()
        s.currentProject.legacyOpenProject = null
      }

      ctx.loadingManager.resetCurrentProject()
      if (nextState.currentProject?.projectRoot) {
        ctx.loadingManager.projectEnvConfig.load()
        ctx.loadingManager.projectConfig.load().finally(() => {
          ctx.emitter.toLaunchpad()
        })
      }
    })

    nextState = updatedState
    patches = patches.concat(_patches)
  }

  const hasLoadedBaseConfigDeps = () => hasLoaded('machineBrowsers') && hasLoadedProject('configEnvFile') && hasLoadedProject('configFileContents') && hasLoadedProject('currentTestingType')
  const hasChangedBaseConfigDeps = () => hasChanged('machineBrowsers') || hasChangedProject('configEnvFile') || hasChangedProject('configFileContents') || hasChangedProject('currentTestingType')

  const shouldRebuildSetupNodeEventsConfig = hasLoadedBaseConfigDeps() && hasChangedBaseConfigDeps()
  const shouldClearSetupNodeEventsConfig = !hasLoadedBaseConfigDeps() && hasChangedBaseConfigDeps()

  // If we have change the events that give us insufficient information to be able to source the
  // config file
  if (shouldClearSetupNodeEventsConfig) {
    const [updatedState, _patches] = produceWithPatchesWithinDraft(nextState, (s) => {
      ctx.loadingManager.setupNodeEvents.reset()
      s.derived.setupNodeEventsConfig = null
      s.derived.fullConfig = null
      // ctx.loadingManager.setupNodeEvents.load().finally(() => {
      //   ctx.emitter.toLaunchpad()
      // })
    })

    nextState = updatedState
    patches = patches.concat(_patches)
  }

  // If we've changed any of the items that will change the "derived" config
  // value we pass into the `setupNodeEvents`, we need to rebuild that, and then call `setupNodeEvents`
  if (shouldRebuildSetupNodeEventsConfig) {
    const setupNodeEventsConfig = buildSetupNodeEventsConfig({
      cliConfig: nextState.cliConfig,
      userNodePath: nextState.userNodePath,
      userNodeVersion: nextState.userNodeVersion,
      machineBrowsers: ensure(nextState.machineBrowsers.value, 'machineBrowsers'),
      projectConfig: ensure(nextState.currentProject?.configFileContents.value, 'currentProject.configFileContents'),
      currentTestingType: ensure(nextState.currentProject?.currentTestingType, 'currentProject.currentTestringType'),
    })

    //
    const [updatedState, _patches] = produceWithPatchesWithinDraft(nextState, (s) => {
      s.derived.setupNodeEventsConfig = castDraft(setupNodeEventsConfig.config)
      ctx.loadingManager.setupNodeEvents.load().finally(() => {
        ctx.emitter.toLaunchpad()
      })
    })

    nextState = updatedState
    patches = patches.concat(_patches)
  }

  // If we've changed the testing type, we should reload the plugins for the project
  if (hasChangedProject('currentTestingType')) {
    //
  }

  const hasLoadedFullConfigDeps = hasLoadedBaseConfigDeps() && hasLoadedProject('configSetupNodeEvents')
  const hasChangedFullConfigDeps = hasChangedBaseConfigDeps() || hasChangedProject('configSetupNodeEvents')

  if (hasLoadedFullConfigDeps && hasChangedFullConfigDeps) {
    assert(ctx.project, 'project')
    const fullConfig = buildFullConfig({
      projectName: ctx.project.name,
      projectRoot: ctx.project.projectRoot,
      cliConfig: nextState.cliConfig,
      userNodePath: nextState.userNodePath,
      userNodeVersion: nextState.userNodeVersion,
      machineBrowsers: ensure(nextState.machineBrowsers.value, 'machineBrowsers'),
      projectConfig: ensure(nextState.currentProject?.configFileContents.value, 'currentProject.configFileContents'),
      currentTestingType: ensure(nextState.currentProject?.currentTestingType, 'currentProject.currentTestringType'),
      configSetupNodeEvents: ensure(nextState.currentProject?.configSetupNodeEvents, 'configSetupNodeEvents').value?.result ?? {},
      errorString () {
        return 'ERROR'
      },
    })

    const [updatedState, _patches] = produceWithPatches(nextState, (s) => {
      s.derived.fullConfig = fullConfig
      assert(s.currentProject)
      s.currentProject.legacyOpenProject = ctx._apis.projectApi.makeLegacyOpenProject()
    })

    nextState = updatedState
    patches = patches.concat(_patches)
  }

  return {
    coreData: nextState,
    patches,
  }
}

function ensure<T> (val: T | undefined | null, str: string) {
  if (val == null) {
    throw new Error(`Expected ${str} to exist, called from coreDataShapeUpdater`)
  }

  return val
}
