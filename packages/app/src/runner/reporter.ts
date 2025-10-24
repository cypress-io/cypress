import { getMobxRunnerStore, MobxRunnerStore, useSpecStore } from '../store'
import { getReporterElement } from './utils'
import { getEventManager } from '.'
import type { EventManager } from './event-manager'
import { useRunnerUiStore } from '../store/runner-ui-store'

let hasInitializeReporter = false
let reactDomRoot: any = null

export function setInitializedReporter (val: boolean) {
  hasInitializeReporter = val
}

export function unmountReporter () {
  if (reactDomRoot) {
    reactDomRoot.unmount()
    reactDomRoot = null
  }
}

async function resetReporter () {
  if (hasInitializeReporter) {
    await getEventManager().resetReporter()
  }
}

function setupReporter () {
  const $reporterRoot = getReporterElement()

  if (hasInitializeReporter || !$reporterRoot) return

  renderReporter($reporterRoot, getMobxRunnerStore(), getEventManager())

  hasInitializeReporter = true
}

function renderReporter (
  root: HTMLElement,
  store: MobxRunnerStore,
  eventManager: EventManager,
) {
  const runnerUiStore = useRunnerUiStore()
  const specsStore = useSpecStore()

  const reporter = window.UnifiedRunner.React.createElement(window.UnifiedRunner.Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    autoScrollingEnabled: runnerUiStore.autoScrollingEnabled,
    isSpecsListOpen: runnerUiStore.isSpecsListOpen,
    showFetchRequests: runnerUiStore.showFetchRequests,
    error: null,
    resetStatsOnSpecChange: true,
    // Studio can only be enabled for e2e testing
    studioEnabled: window.__CYPRESS_TESTING_TYPE__ === 'e2e',
    runnerStore: store,
    testFilter: specsStore.testFilter,
  })

  reactDomRoot = window.UnifiedRunner.ReactDOM.createRoot(root)

  reactDomRoot.render(reporter)
}

export const UnifiedReporterAPI = {
  setupReporter,
  hasInitializeReporter,
  resetReporter,
  setInitializedReporter,
}
