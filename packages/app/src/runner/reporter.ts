import { getMobxRunnerStore, MobxRunnerStore, useSpecStore } from '../store'
import { getReporterElement } from './utils'
import { getEventManager } from '.'
import { getRunnerConfigFromWindow } from './get-runner-config-from-window'
import type { EventManager } from './event-manager'
import { useRunnerUiStore } from '../store/runner-ui-store'

let hasInitializeReporter = false

export function setInitializedReporter (val: boolean) {
  hasInitializeReporter = val
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

  const config = getRunnerConfigFromWindow()

  const reporter = window.UnifiedRunner.React.createElement(window.UnifiedRunner.Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    autoScrollingEnabled: runnerUiStore.autoScrollingEnabled,
    isSpecsListOpen: runnerUiStore.isSpecsListOpen,
    error: null,
    resetStatsOnSpecChange: true,
    // Studio can only be enabled for e2e testing
    studioEnabled: window.__CYPRESS_TESTING_TYPE__ === 'e2e' && config.experimentalStudio,
    runnerStore: store,
    testFilter: specsStore.testFilter,
  })

  const reactDomRoot = window.UnifiedRunner.ReactDOM.createRoot(root)

  reactDomRoot.render(reporter)
}

export const UnifiedReporterAPI = {
  setupReporter,
  hasInitializeReporter,
  resetReporter,
  setInitializedReporter,
}
