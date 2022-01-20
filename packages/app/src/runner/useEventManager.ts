import { watch } from 'vue'
import { getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '.'
import { useAutStore, useSpecStore } from '../store'
import { useScreenshotStore } from '../store/screenshot-store'
import { empty, getReporterElement, getRunnerElement } from './utils'

export function useEventManager () {
  const eventManager = getEventManager()

  const autStore = useAutStore()
  const specStore = useSpecStore()

  function runSpec () {
    if (!specStore.activeSpec) {
      throw Error(`Cannot run spec when specStore.active spec is null!`)
    }

    autStore.setScriptError(null)
    UnifiedRunnerAPI.executeSpec(specStore.activeSpec)
  }

  function initializeRunnerLifecycleEvents () {
    const screenshotStore = useScreenshotStore()

    // these events do not use GraphQL
    eventManager.on('restart', () => {
      runSpec()
    })

    eventManager.on('before:screenshot', (payload) => {
      if (payload.appOnly) {
        screenshotStore.setScreenshotting(true)
      }

      getAutIframeModel().beforeScreenshot(payload)
    })

    eventManager.on('after:screenshot', (config) => {
      screenshotStore.setScreenshotting(false)
      getAutIframeModel().afterScreenshot(config)
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
  }

  const startSpecWatcher = () => {
    return watch(() => specStore.activeSpec, (spec) => {
      runSpec()
    }, { immediate: true, flush: 'post' })
  }

  function cleanupRunner () {
    // Clean up the AUT and Reporter every time we leave the route.
    empty(getRunnerElement())

    // TODO: this should be handled by whoever starts it, reporter?
    window.UnifiedRunner.shortcuts.stop()

    empty(getReporterElement())
  }

  return {
    initializeRunnerLifecycleEvents,
    runSpec,
    startSpecWatcher,
    cleanupRunner,
  }
}
