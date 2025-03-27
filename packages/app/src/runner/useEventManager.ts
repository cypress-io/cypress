import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { addCrossOriginIframe, getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '.'
import { useAutStore, useSpecStore } from '../store'
import { useStudioStore } from '../store/studio-store'
import { empty, getReporterElement, getRunnerElement } from './utils'

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

    eventManager.on('visit:failed', (payload) => {
      getAutIframeModel().showVisitFailure(payload)
    })

    eventManager.on('page:loading', (isLoading) => {
      if (isLoading) {
        return
      }

      getAutIframeModel().reattachStudio()
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
