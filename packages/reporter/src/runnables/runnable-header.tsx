import { observer } from 'mobx-react'
import React, { ReactElement } from 'react'

import type { StatsStore } from '../header/stats-store'
import { RunnablesStore } from './runnables-store'
import { DebugDismiss } from '../header/DebugDismiss'
import { Duration } from '../duration/duration'
import { SpecFileName } from '../shared/SpecFileName'

const renderRunnableHeader = (children: ReactElement, enableStickyHeader?: boolean) => (
  <div 
    className={`runnable-header${enableStickyHeader ? ' sticky-header' : ''}`} 
    data-cy="runnable-header"
  >
    {children}
  </div>
)

interface RunnableHeaderProps {
  spec: Cypress.Cypress['spec']
  statsStore: StatsStore
  runnablesStore: RunnablesStore
  experimentalStudio?: boolean
}

const RunnableHeader: React.FC<RunnableHeaderProps> = observer(({ spec, statsStore, runnablesStore, experimentalStudio }) => {
  if (spec.relative === '__all') {
    if (spec.specFilter) {
      return renderRunnableHeader(
        <span><span>Specs matching "{spec.specFilter}"</span></span>,
        experimentalStudio,
      )
    }

    return renderRunnableHeader(
      <span><span>All Specs</span></span>,
      experimentalStudio,
    )
  }

  return renderRunnableHeader(
    <>
      <SpecFileName spec={spec} />
      {runnablesStore.testFilter && runnablesStore.totalTests > 0 && <DebugDismiss matched={runnablesStore.totalTests} total={runnablesStore.totalUnfilteredTests} />}
      <Duration duration={statsStore.duration} />
    </>,
    experimentalStudio,
  )
})

RunnableHeader.displayName = 'RunnableHeader'

export default RunnableHeader
