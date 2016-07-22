import { observer } from 'mobx-react'
import React from 'react'

import events from '../lib/events'

import Controls from './controls'
import Stats from './stats'
import Tooltip from '../tooltip/tooltip'

const Header = observer(({ appState, events, statsStore }) => (
  <header>
    <Tooltip placement='bottom' title='View All Tests'>
      <button className='focus-tests' onClick={() => events.emit('focus:tests')}>
        <i className='fa fa-question-circle'></i> All Tests
      </button>
    </Tooltip>
    <Stats stats={statsStore} />
    <Controls appState={appState} />
  </header>
))

Header.defaultProps = {
  events,
}

export default Header
