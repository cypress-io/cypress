import { getStore, Store } from '../store'
import { getReporterElement } from './utils'

let hasInitializeReporter = false

async function unmountReporter () {
  // We do not need to unmount the reporter at any point right now,
  // but this will likely be useful for cleaning up at some point.
  window.UnifiedRunner.ReactDOM.unmountComponentAtNode(getReporterElement())
}

async function resetReporter () {
  if (hasInitializeReporter) {
    await window.UnifiedRunner.eventManager.teardownReporter()
  }
}

function setupReporter () {
  const $reporterRoot = getReporterElement()

  renderReporter($reporterRoot, getStore(), window.UnifiedRunner.eventManager)
  hasInitializeReporter = true
}

function renderReporter (
  root: HTMLElement,
  store: Store,
  eventManager: typeof window.UnifiedRunner.eventManager,
) {
  class EmptyHeader extends window.UnifiedRunner.React.Component {
    render () {
      return window.UnifiedRunner.React.createElement('div')
    }
  }

  const reporter = window.UnifiedRunner.React.createElement(window.UnifiedRunner.Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    key: store.specRunId,
    spec: store.spec,
    specRunId: store.specRunId,
    error: null, // errorMessages.reporterError(props.state.scriptError, props.state.spec.relative),
    resetStatsOnSpecChange: true,
    experimentalStudioEnabled: false,
    // TODO: Are we re-skinning the Reporter header?
    // If so, with React or Vue?
    // For now, just render and empty div.
    renderReporterHeader: (props: null) => window.UnifiedRunner.React.createElement(EmptyHeader, props),
  })

  window.UnifiedRunner.ReactDOM.render(reporter, root)
}

export const UnifiedReporterAPI = {
  unmountReporter,
  setupReporter,
  hasInitializeReporter,
  resetReporter,
}
