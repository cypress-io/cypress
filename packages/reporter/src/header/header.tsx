import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents from '../lib/events'
import { AppState } from '../lib/app-state'

import Controls from './controls'
import Stats from './stats'
import { IStatsStore } from './stats-store'

interface Props {
  appState: AppState
  events?: any
  statsStore: IStatsStore
}

const Header = observer(({ appState, events = defaultEvents, statsStore }: Props) => (
  <header>
    <Tooltip placement='bottom' title={<p>View All Tests <span className='kbd'>F</span></p>} wrapperClassName='focus-tests'>
      <button onClick={() => events.emit('focus:tests')}>
        <i className='fa fa-chevron-left'></i>
        <span>Tests</span>
      </button>
    </Tooltip>
    <Stats stats={statsStore} />
    <div className='spacer' />
    <Controls appState={appState} />
  </header>
))

export default Header
