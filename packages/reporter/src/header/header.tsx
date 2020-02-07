import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '../lib/events'
import { AppState } from '../lib/app-state'

import Controls from './controls'
import Options from './options'
import Stats from './stats'
import { StatsStore } from './stats-store'

interface Props {
  appState: AppState
  events?: Events
  statsStore: StatsStore
}

const Header = observer(({ appState, events = defaultEvents, statsStore }: Props) => {
  const state = useLocalStore(() => ({
    isShowingOptions: false,
    toggleShowingOptions: action(() => {
      state.isShowingOptions = !state.isShowingOptions
    }),
  }))

  return (
    <header>
      <Tooltip placement='bottom' title={<p>View All Tests <span className='kbd'>F</span></p>} wrapperClassName='focus-tests'>
        <button onClick={() => events.emit('focus:tests')}>
          <i className='fas fa-chevron-left'></i>
          <span>Tests</span>
        </button>
      </Tooltip>
      <Stats stats={statsStore} />
      <div className='spacer' />
      <Controls appState={appState} isShowingOptions={state.isShowingOptions} onToggleOptions={state.toggleShowingOptions} />
      {state.isShowingOptions && <Options appState={appState} />}
    </header>
  )
})

export default Header
