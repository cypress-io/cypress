import { watch } from 'vue'
import { addCrossOriginIframe, getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '.'
import { useAutStore, useSpecStore } from '../store'
import { empty, getReporterElement, getRunnerElement } from './utils'

export function useEventManager () {
  const eventManager = getEventManager()

  const autStore = useAutStore()
  const specStore = useSpecStore()

  function runSpec () {
    if (!specStore.activeSpec) {
      throw Error(`Cannot run spec when specStore.active spec is null or undefined!`)
    }

    autStore.setScriptError(null)
    UnifiedRunnerAPI.executeSpec(specStore.activeSpec)
  }

  function initializeRunnerLifecycleEvents () {
    // these events do not use GraphQL
    eventManager.on('restart', () => {
      // If we get the event to restart but have already navigated away from the runner, don't execute the spec
      if (specStore.activeSpec) {
        runSpec()
      }
    })

    eventManager.on('script:error', (err) => {
      autStore.setScriptError(err)
    })

    eventManager.on('visit:failed', (payload) => {
      getAutIframeModel().showVisitFailure(payload)
    })

    eventManager.on('visit:blank', ({ type }) => {
      getAutIframeModel().visitBlank({ type })
    })

    eventManager.on('expect:origin', addCrossOriginIframe)
  }

  const startSpecWatcher = () => {
    return watch(() => specStore.activeSpec, () => {
      if (specStore.activeSpec) {
        runSpec()
      }
    }, { immediate: true, flush: 'post' })
  }

  function cleanupRunner () {
    // Clean up the AUT and Reporter every time we leave the route.
    empty(getRunnerElement())

    // TODO: UNIFY-1318 - this should be handled by whoever starts it, reporter?
    window.UnifiedRunner.shortcuts.stop()

    const reporterElement = getReporterElement()

    if (reporterElement) {
      // reporter can be disabled by the user,
      // so sometimes will not exist to be cleaned up
      empty(reporterElement)
    }
  }

  return {
    initializeRunnerLifecycleEvents,
    runSpec,
    startSpecWatcher,
    cleanupRunner,
  }
}
