import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '../lib/events'
import type { AppState } from '../lib/app-state'

import ChevronDownIcon from '@packages/frontend-shared/src/assets/icons/chevron-down-small_x16.svg'
import ChevronUpIcon from '@packages/frontend-shared/src/assets/icons/chevron-up-small_x16.svg'
import { IconActionNext, IconActionPlayLarge, IconActionRestart, IconActionStopCircle } from '@cypress-design/react-icon'

const iconStrokeColor = 'gray-500'

const iconFillColor = 'gray-900'

const ifThen = (condition: boolean, component: React.ReactNode) => (
  condition ? component : null
)

interface Props {
  events?: Events
  appState: AppState
}

const Controls: React.FC<Props> = observer(({ events = defaultEvents, appState }: Props) => {
  const emit = (event: string) => () => events.emit(event)
  const togglePreferencesMenu = () => {
    appState.togglePreferencesMenu()
    events.emit('save:state')
  }

  return (
    <div className={cs({ 'controls-container-studio': appState.studioActive, 'controls-container': !appState.studioActive })}>
      <Tooltip placement='bottom' title={<p>Open Testing Preferences</p>} className='cy-tooltip'>
        <button
          aria-label='Open testing preferences'
          className={cs('testing-preferences-toggle', { 'open': appState.isPreferencesMenuOpen })}
          onClick={action('toggle:preferences:menu', togglePreferencesMenu)}
        >
          {appState.isPreferencesMenuOpen ? (
            <ChevronUpIcon />
          ) : (
            <ChevronDownIcon />
          )}
        </button>
      </Tooltip>
      <div className='controls'>
        {ifThen(appState.isPaused, (
          <Tooltip placement='bottom' title={<p>Resume <span className='kbd'>C</span></p>} className='cy-tooltip'>
            <button aria-label='Resume' className='play' onClick={emit('resume')}>
              <IconActionPlayLarge size='16' strokeColor={iconStrokeColor} fillColor={iconFillColor} />
            </button>
          </Tooltip>
        ))}
        {ifThen(appState.isRunning && !appState.isPaused, (
          <Tooltip placement='bottom' title={<p>Stop Running <span className='kbd'>S</span></p>} className='cy-tooltip' visible={appState.studioActive ? false : null}>
            <button aria-label='Stop' className='stop' onClick={emit('stop')} disabled={appState.studioActive}>
              <IconActionStopCircle size='16' strokeColor={iconStrokeColor} />
            </button>
          </Tooltip>
        ))}
        {ifThen(!appState.isRunning, (
          <Tooltip placement='bottom' title={<p>Run All Tests <span className='kbd'>R</span></p>} className='cy-tooltip'>
            <button aria-label='Rerun all tests' className='restart' onClick={emit('restart')}>
              {appState.studioActive ? (
                <IconActionRestart transform="scale(-1 1)" strokeColor={iconStrokeColor} />
              ) : (
                <IconActionRestart strokeColor={iconStrokeColor} />
              )}
            </button>
          </Tooltip>
        ))}
        {ifThen(!!appState.nextCommandName, (
          <Tooltip placement='bottom' title={<p>Next <span className='kbd'>[N]:</span>{appState.nextCommandName}</p>} className='cy-tooltip'>
            <button aria-label={`Next '${appState.nextCommandName}'`} className='next' onClick={emit('next')}>
              <IconActionNext size='16' strokeColor={iconStrokeColor} fillColor={iconFillColor} />
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
})

Controls.displayName = 'Controls'

export default Controls
