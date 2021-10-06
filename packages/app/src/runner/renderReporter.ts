import { UnifiedRunnerAPI } from '../runner'
import type { Store } from '../store'

export async function unmountReporter () {
  window.UnifiedRunner.ReactDOM.unmountComponentAtNode(UnifiedRunnerAPI.getReporterElement())
}

export function renderReporter (
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
