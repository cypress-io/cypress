import { Reporter } from '@packages/reporter/src/main'
import { eventManager as EventManager } from '@packages/runner-shared/src/event-manager'
import type { SpecFile } from '@packages/types/src/spec'
import React from 'react'
import ReactDOM from 'react-dom'

export function renderReporter (
  root: HTMLDivElement, 
  spec: SpecFile,
  eventManager: typeof EventManager
) {
  ReactDOM.render(
    React.createElement(Reporter, {
        runMode: 'single' as const,
        runner: eventManager.reporterBus,
        // className: cs({ 'display-none': props.state.screenshotting }, styles.reporter),
        spec,
        specRunId: 'id-123',
        allSpecs: false,
        error: null, // errorMessages.reporterError(props.state.scriptError, props.state.spec.relative),
        resetStatsOnSpecChange: true,
        // renderReporterHeader: renderReporterHeader,
        experimentalStudioEnabled: false,
    }),
    root
  )
}
