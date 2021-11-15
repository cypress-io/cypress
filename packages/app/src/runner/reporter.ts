import { getMobxRunnerStore, MobxRunnerStore } from '../store'
import { getReporterElement } from './utils'
import { getEventManager } from '.'
import type { EventManager } from './event-manager'

let hasInitializeReporter = false

async function unmountReporter () {
  // We do not need to unmount the reporter at any point right now,
  // but this will likely be useful for cleaning up at some point.
  window.UnifiedRunner.ReactDOM.unmountComponentAtNode(getReporterElement())
}

async function resetReporter () {
  if (hasInitializeReporter) {
    await getEventManager().teardownReporter()
  }
}

function setupReporter () {
  const $reporterRoot = getReporterElement()

  renderReporter($reporterRoot, getMobxRunnerStore(), getEventManager())
  hasInitializeReporter = true
}

function renderReporter (
  root: HTMLElement,
  store: MobxRunnerStore,
  eventManager: EventManager,
) {
  const reporter = window.UnifiedRunner.React.createElement(window.UnifiedRunner.Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    key: store.specRunId,
    spec: store.spec,
    specRunId: store.specRunId,
    error: null, // errorMessages.reporterError(props.state.scriptError, props.state.spec.relative),
    resetStatsOnSpecChange: true,
    experimentalStudioEnabled: false,
  })

  window.UnifiedRunner.ReactDOM.render(reporter, root)
}

export const UnifiedReporterAPI = {
  unmountReporter,
  setupReporter,
  hasInitializeReporter,
  resetReporter,
}
