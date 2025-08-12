import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import Button from '@cypress-design/react-button'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '../lib/events'
import type { AppState } from '../lib/app-state'

import { IconChevronDownSmall, IconChevronUpSmall, IconActionNext, IconActionPlayLarge, IconActionRestart, IconActionStopCircle } from '@cypress-design/react-icon'

const iconStrokeColor = 'gray-500'
const iconFillColor = 'gray-900'

interface Props {
  events?: Events
  appState: AppState
  displayPreferencesButton?: boolean
}

const Controls: React.FC<Props> = observer(({ events = defaultEvents, appState, displayPreferencesButton = true }: Props) => {
  const emit = (event: string) => () => events.emit(event)
  const togglePreferencesMenu = () => {
    appState.togglePreferencesMenu()
    events.emit('save:state')
  }

  return (
    <div className='controls'>
      {displayPreferencesButton && (
        <Tooltip placement='bottom' title={<p>Open Testing Preferences</p>} className='cy-tooltip'>
          <div>
            <Button
              size='20'
              variant='outline-dark'
              aria-label='Open testing preferences'
              data-cy='testing-preferences-toggle'
              onClick={action('toggle:preferences:menu', togglePreferencesMenu)}
            >
              {appState.isPreferencesMenuOpen ? (
                <IconChevronUpSmall strokeColor='gray-500' />
              ) : (
                <IconChevronDownSmall strokeColor='gray-500' />
              )}
            </Button>
          </div>
        </Tooltip>
      )}
      {appState.isPaused && (
        <Tooltip placement='bottom' title={<p>Resume <span className='kbd'>C</span></p>} className='cy-tooltip'>
          <div>
            <Button size='20' variant='outline-dark' aria-label='Resume' className='play' onClick={emit('resume')}>
              <IconActionPlayLarge size='16' strokeColor={iconStrokeColor} fillColor={iconFillColor} />
            </Button>
          </div>
        </Tooltip>
      )}
      {appState.isRunning && !appState.isPaused && (
        <Tooltip placement='bottom' title={<p>Stop Running <span className='kbd'>S</span></p>} className='cy-tooltip'>
          <div>
            <Button size='20' variant='outline-dark' aria-label='Stop' className='stop' onClick={emit('stop')}>
              <IconActionStopCircle size='16' strokeColor={iconStrokeColor} />
            </Button>
          </div>
        </Tooltip>
      )}
      {!appState.isRunning && (
        <Tooltip placement='bottom' title={<p>Run All Tests <span className='kbd'>R</span></p>} className='cy-tooltip'>
          <div>
            <Button size='20' variant='outline-dark' aria-label='Rerun all tests' className='restart' onClick={emit('restart')}>
              {appState.studioActive ? (
                <IconActionRestart transform="scale(-1 1)" strokeColor={iconStrokeColor} />
              ) : (
                <IconActionRestart strokeColor={iconStrokeColor} />
              )}
            </Button>
          </div>
        </Tooltip>
      )}
      {!!appState.nextCommandName && (
        <Tooltip placement='bottom' title={<p>Next <span className='kbd'>[N]:</span>{appState.nextCommandName}</p>} className='cy-tooltip'>
          <div>
            <Button size='20' variant='outline-dark' aria-label={`Next '${appState.nextCommandName}'`} className='next' onClick={emit('next')}>
              <IconActionNext size='16' strokeColor={iconStrokeColor} fillColor={iconFillColor} />
            </Button>
          </div>
        </Tooltip>
      )}
    </div>
  )
})

Controls.displayName = 'Controls'

export default Controls
