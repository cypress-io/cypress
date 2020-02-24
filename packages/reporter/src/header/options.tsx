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

      <div className='test-filter'>
        <label>Filter:</label>
        <div className='test-filter-group button-group' role='group'>
          <button className={cs('filter-passed', { active: filter === 'passed' })} onClick={setFilter('passed')}>
            <i className='fas fa-check' /> Passed
          </button>
          <button className={cs('filter-failed', { active: filter === 'failed' })} onClick={setFilter('failed')}>
            <i className='fas fa-times' /> Failed
          </button>
          <button className={cs('filter-pending', { active: filter === 'pending' })} onClick={setFilter('pending')}>
            <i className='fas fa-circle-notch' /> Pending
          </button>
        </div>
        {!!filter && (
          <button className='clear-filter' onClick={setFilter(null)}>
            <i className='fas fa-times' /> Clear filter
          </button>
        )}
      </div>
    </div>
  )
})

export default Options
