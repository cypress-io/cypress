import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import MenuExpandRightIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/menu-expand-right_x16.svg'

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
        <MenuExpandRightIcon />

        <span className='focus-tests-text'>Specs</span>
      </button>
    </Tooltip>
    <div className='spacer' />
    <Stats stats={statsStore} />
    <Controls appState={appState} />
  </header>
))

export default Header
