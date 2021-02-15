import * as React from 'react'
import { observer } from 'mobx-react'
import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
import Stats from '@packages/reporter/src/header/stats'
import Controls from '@packages/reporter/src/header/controls'
import { StatsStore } from '@packages/reporter/src/header/stats-store'

export const EmptyReporterHeader: React.FC = () => {
  return (
    <header>
      <Stats stats={{ numPassed: 0, numFailed: 0, numPending: 0, duration: 0 } as StatsStore} />
    </header>
  )
}

export const ReporterHeader: React.FC<ReporterHeaderProps> = observer(
  function ReporterHeader ({ statsStore, appState }) {
    return (
      <header>
        <Stats stats={statsStore} />
        <div className='spacer' />
        <Controls appState={appState} />
      </header>
    )
  },
)
