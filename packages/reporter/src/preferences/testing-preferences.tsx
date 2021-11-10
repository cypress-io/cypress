import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'

import { AppState } from '../lib/app-state'
import defaultEvents, { Events } from '../lib/events'

interface Props {
  events?: Events
  appState: AppState
}

const TestingPreferences = observer(({
  events = defaultEvents,
  appState,
}: Props) => {
  const toggleAutoScrolling = () => {
    appState.toggleAutoScrolling()
    events.emit('save:state')
  }

  return (
    <div>
      Hello world

      <button
        aria-label={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`}
        className={cs('toggle-auto-scrolling', { 'auto-scrolling-enabled': appState.autoScrollingEnabled })}
        onClick={action('toggle:auto:scrolling', toggleAutoScrolling)}
      >
        Toggle auto-scroll
      </button>
      Auto scrolling is:&nbsp;
      {appState.autoScrollingEnabled ? (
        'on'
      ) : (
        'off'
      )}
    </div>
  )
})

export default TestingPreferences
