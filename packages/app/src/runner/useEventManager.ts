import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { addCrossOriginIframe, getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '.'
import { useAutStore, useSpecStore } from '../store'
import { useStudioStore } from '../store/studio-store'
import { empty, getReporterElement, getRunnerElement } from './utils'
import { unmountReporter } from './reporter'

// An agent reads this without the runner's code frame, so it keeps the stack, which names the file and
// line the spec threw at. A rejection that is not an Error, such as a plain object, still gets its message.
function formatSpecLoadError (err: unknown): string {
  if (err instanceof Error) {
    return err.stack || `${err.name}: ${err.message}`
  }

  if (err && typeof err === 'object') {
    const { name, message, stack } = err as { name?: unknown, message?: unknown, stack?: unknown }

    if (typeof stack === 'string' && stack) {
      return stack
    }

    if (typeof message === 'string') {
      return typeof name === 'string' ? `${name}: ${message}` : message
    }

    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }

  return String(err)
}

export function useEventManager () {
  const eventManager = getEventManager()

  const autStore = useAutStore()
  const specStore = useSpecStore()
  const studioStore = useStudioStore()
  const router = useRouter()

  async function runSpec (isRerun: boolean = false) {
    if (!specStore.activeSpec) {
      throw Error(`Cannot run spec when specStore.active spec is null or undefined!`)
    }

    autStore.setScriptError(null)
    autStore.setSpecLoadError(null)
    await UnifiedRunnerAPI.executeSpec(specStore.activeSpec, isRerun)
  }

  function initializeRunnerLifecycleEvents () {
    // these events do not use GraphQL
    eventManager.on('restart', async () => {
      // If we get the event to restart but have already navigated away from the runner, don't execute the spec
      if (specStore.activeSpec) {
        const isRerun = true

        await runSpec(isRerun)
      }
    })

    eventManager.on('script:error', (err) => {
      autStore.setScriptError(err)
    })

    eventManager.on('spec:load:error', (err) => {
      autStore.setSpecLoadError(formatSpecLoadError(err))
    })

    eventManager.on('visit:failed', (payload) => {
      getAutIframeModel().showVisitFailure(payload)
    })

    eventManager.on('visit:blank', async ({ testIsolation }) => {
      await getAutIframeModel().visitBlankPage(testIsolation)
    })

    eventManager.on('run:end', () => {
      if (studioStore.isLoading) {
        getAutIframeModel().startStudio()
      }
    })

    eventManager.on('expect:origin', addCrossOriginIframe)

    eventManager.on('testFilter:cloudDebug:dismiss', async () => {
      const currentRoute = router.currentRoute.value

      const { mode, ...query } = currentRoute.query

      // Delete runId from query which will remove the test filter and trigger a rerun
      await router.replace({ ...currentRoute, query })
    })
  }

  const startSpecWatcher = () => {
    return watch(() => specStore.activeSpec, async () => {
      if (specStore.activeSpec) {
        await runSpec()
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
      // NOTE: we do not use empty() on the reporter as it is written in react.
      // As of React 18, its better to call unmount on the root, which effectively does the same thing as empty().
      unmountReporter()
    }
  }

  return {
    initializeRunnerLifecycleEvents,
    runSpec,
    startSpecWatcher,
    cleanupRunner,
  }
}
