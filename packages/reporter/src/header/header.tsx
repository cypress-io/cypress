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

const Header = observer(({ appState, events = defaultEvents, statsStore }: ReporterHeaderProps) => (
  <header>
    <Tooltip placement='bottom' title={<p>View All Tests <span className='kbd'>F</span></p>} wrapperClassName='focus-tests' className='cy-tooltip'>
      <button onClick={() => events.emit('focus:tests')}>
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1H7M1 6H13M13 6L10.5 3.5M13 6L10.5 8.5M1 11H7" stroke="#5A5F7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        <span className='focus-tests-text'>Specs</span>
      </button>
    </Tooltip>
    <div className='spacer' />
    <Stats stats={statsStore} />
    <Controls appState={appState} />
  </header>
))

export default Header
