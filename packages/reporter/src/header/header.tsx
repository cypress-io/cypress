import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '../lib/events'
import { AppState } from '../lib/app-state'

import Controls from './controls'
import Stats from './stats'
import { StatsStore } from './stats-store'

export interface ReporterHeaderProps {
  appState: AppState
  events?: Events
  statsStore: StatsStore
}

const formatDuration = (duration: number) => duration ? String((duration / 1000).toFixed(2)).padStart(5, '0') : '--'

const Duration = observer(({ stats }: { stats: StatsStore }) => {
  return (
    <li className='reporter-duration reporter-li'>
      <span className='num'>{formatDuration(stats.duration)}</span>
    </li>
  )
})

const Header = observer(({ appState, events = defaultEvents, statsStore }: ReporterHeaderProps) => (
  <header>
    <ul className='control-items controls'>
      <Tooltip placement='bottom' title={<p>View All Tests <span className='kbd'>F</span></p>} wrapperClassName='focus-tests' className='cy-tooltip'>
        <button onClick={() => events.emit('focus:tests')}>
          <i className='fas fa-chevron-left' />
          <span className='focus-tests-text'>Tests</span>
        </button>
      </Tooltip>
      <Stats stats={statsStore} />
      <Duration stats={statsStore} />
      <Controls appState={appState} />
    </ul>
  </header>
))

export default Header
