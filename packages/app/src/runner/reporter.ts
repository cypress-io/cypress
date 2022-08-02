import { getMobxRunnerStore, MobxRunnerStore } from '../store'
import { getReporterElement } from './utils'
import { getEventManager } from '.'
import type { EventManager } from './event-manager'
import { useRunnerUiStore } from '../store/runner-ui-store'

let hasInitializeReporter = false

export function setInitializedReporter (val: boolean) {
  hasInitializeReporter = val
}

async function unmountReporter () {
  // We do not need to unmount the reporter at any point right now,
  // but this will likely be useful for cleaning up at some point.
  window.UnifiedRunner.ReactDOM.unmountComponentAtNode(getReporterElement())
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

  const reporter = window.UnifiedRunner.React.createElement(window.UnifiedRunner.Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    autoScrollingEnabled: runnerUiStore.autoScrollingEnabled,
    isSpecsListOpen: runnerUiStore.isSpecsListOpen,
    error: null, // errorMessages.reporterError(props.state.scriptError, props.state.spec.relative),
    resetStatsOnSpecChange: true,
    experimentalStudioEnabled: false,
    runnerStore: store,
  })

  window.UnifiedRunner.ReactDOM.render(reporter, root)
}

export const UnifiedReporterAPI = {
  unmountReporter,
  setupReporter,
  hasInitializeReporter,
  resetReporter,
  setInitializedReporter,
}
