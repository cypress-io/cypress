import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'

import { AppState } from '../lib/app-state'
import defaultEvents, { Events } from '../lib/events'
import Switch from '../lib/switch'

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
    <div className="testing-preferences">
      <div className="testing-preferences-header">
        Testing Preferences
      </div>

      <div className="testing-preference">
        <div className="testing-preference-header">
          Auto-scrolling
          <Switch
            data-cy="auto-scroll-switch"
            value={appState.autoScrollingEnabled}
            onUpdate={action('toggle:auto:scrolling', toggleAutoScrolling)}
          />
        </div>
        <div>
          Automatically scroll the command log while the tests are running.
        </div>
      </div>
    </div>
  )
})

export default TestingPreferences
