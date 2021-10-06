import { Reporter } from '@packages/reporter/src/main'
import React from 'react'
import ReactDOM from 'react-dom'
import { getReporterElement } from '../runner'
import type { Store } from '../store'

export async function unmountReporter () {
  ReactDOM.unmountComponentAtNode(getReporterElement())
}

class EmptyHeader extends React.Component {
  render () {
    return React.createElement('div')
  }
}

export function renderReporter (
  root: HTMLElement, 
  store: Store,
  eventManager: typeof window.UnifiedRunner.eventManager
) {
  const reporter = React.createElement(Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    key: store.specRunId,
    spec: store.spec,
    specRunId: store.specRunId,
    error: null, // errorMessages.reporterError(props.state.scriptError, props.state.spec.relative),
    resetStatsOnSpecChange: true,
    experimentalStudioEnabled: false,
    // TODO: Are we re-skinning the CommandLog header?
    // If so, with React or Vue?
    // For now, just render and empty div.
    renderReporterHeader: (props) => React.createElement(EmptyHeader, props)
  })

  ReactDOM.render(reporter, root)
}
