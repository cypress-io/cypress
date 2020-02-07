import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import { TestState } from '../test/test-model'
import runnablesStore from '../runnables/runnables-store'
import { AppState } from '../lib/app-state'

import defaultEvents, { Events } from '../lib/events'

interface Props {
  appState: AppState
  events?: Events
}

const Options = observer(({ appState, events = defaultEvents }: Props) => {
  const setFilter = (filter: TestState | null) => () => {
    runnablesStore.setFilter(filter)
  }

  const toggleAutoScrolling = () => {
    appState.toggleAutoScrolling()
    events.emit('save:state')
  }

  const filter = runnablesStore.activeFilter

  return (
    <div className='options'>
      <button
        aria-label={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`}
        className={cs('toggle-auto-scrolling', { 'auto-scrolling-enabled': appState.autoScrollingEnabled })}
        onClick={toggleAutoScrolling}
      >
        <i className='auto-scrolling-indicator fas' /> Auto-scrolling
        <Tooltip title='When enabled, the command log will automatically scroll to keep the currently running test in view'>
          <i className='fas fa-info-circle' />
        </Tooltip>
      </button>

      <form className='test-filter'>
        <legend>Filter:</legend>
        <label>
          <input type='radio' value='' checked={filter === null} onChange={setFilter(null)} />
          None
        </label>
        <label>
          <input type='radio' value='active' checked={filter === 'active'} onChange={setFilter('active')} />
          Running
        </label>
        <label>
          <input type='radio' value='passed' checked={filter === 'passed'} onChange={setFilter('passed')} />
          Passed
        </label>
        <label>
          <input type='radio' value='failed' checked={filter === 'failed'} onChange={setFilter('failed')} />
          Failed
        </label>
        <label>
          <input type='radio' value='pending' checked={filter === 'pending'} onChange={setFilter('pending')} />
          Pending
        </label>
      </form>
    </div>
  )
})

export default Options
