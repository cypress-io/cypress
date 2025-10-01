import { observer } from 'mobx-react'
import React, { ReactElement } from 'react'

import type { StatsStore } from '../header/stats-store'
import { RunnablesStore } from './runnables-store'
import { DebugDismiss } from '../header/DebugDismiss'
import { Duration } from '../duration/duration'
import { SpecFileName } from '../shared/SpecFileName'
import { RunnablePopoverOptions } from './runnable-popover-options'
import appState from '../lib/app-state'

const renderRunnableHeader = (children: ReactElement) => <div className="runnable-header" data-cy="runnable-header">{children}</div>

interface RunnableHeaderProps {
  spec: Cypress.Cypress['spec']
  statsStore: StatsStore
  runnablesStore: RunnablesStore
}

const RunnableHeader: React.FC<RunnableHeaderProps> = observer(({ spec, statsStore, runnablesStore }) => {
  if (spec.relative === '__all') {
    if (spec.specFilter) {
      return renderRunnableHeader(
        <span><span>Specs matching "{spec.specFilter}"</span></span>,
      )
    }

    return renderRunnableHeader(
      <span><span>All Specs</span></span>,
    )
  }

  const isStudioSingleTest = appState?.studioActive && appState.studioSingleTestActive

  return renderRunnableHeader(
    <>
      <SpecFileName spec={spec} />
      {runnablesStore.testFilter && runnablesStore.totalTests > 0 && <DebugDismiss matched={runnablesStore.totalTests} total={runnablesStore.totalUnfilteredTests} />}
      {!isStudioSingleTest && <Duration duration={statsStore.duration} />}
      <RunnablePopoverOptions spec={spec} />
    </>,
  )
})

RunnableHeader.displayName = 'RunnableHeader'

export default RunnableHeader
