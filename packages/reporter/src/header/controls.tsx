import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '../lib/events'
import { AppState } from '../lib/app-state'

import ChevronDownIcon from '@packages/frontend-shared/src/assets/icons/chevron-down-small_x16.svg'
import ChevronUpIcon from '@packages/frontend-shared/src/assets/icons/chevron-up-small_x16.svg'
import NextIcon from '@packages/frontend-shared/src/assets/icons/action-next_x16.svg'
import PlayIcon from '@packages/frontend-shared/src/assets/icons/action-play_x16.svg'
import RestartIcon from '@packages/frontend-shared/src/assets/icons/action-restart_x16.svg'
import StopIcon from '@packages/frontend-shared/src/assets/icons/action-stop_x16.svg'

const ifThen = (condition: boolean, component: React.ReactNode) => (
  condition ? component : null
)

interface Props {
  events?: Events
  appState: AppState
}

const Controls = observer(({ events = defaultEvents, appState }: Props) => {
  const emit = (event: string) => () => events.emit(event)
  const togglePreferencesMenu = () => {
    appState.togglePreferencesMenu()
    events.emit('save:state')
  }

  return (
    <div className='controls'>
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
      {ifThen(appState.isPaused, (
        <Tooltip placement='bottom' title={<p>Resume <span className='kbd'>C</span></p>} className='cy-tooltip'>
          <button aria-label='Resume' className='play' onClick={emit('resume')}>
            <PlayIcon />
          </button>
        </Tooltip>
      ))}
      {ifThen(appState.isRunning && !appState.isPaused, (
        <Tooltip placement='bottom' title={<p>Stop Running <span className='kbd'>S</span></p>} className='cy-tooltip' visible={appState.studioActive ? false : null}>
          <button aria-label='Stop' className='stop' onClick={emit('stop')} disabled={appState.studioActive}>
            <StopIcon />
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isRunning, (
        <Tooltip placement='bottom' title={<p>Run All Tests <span className='kbd'>R</span></p>} className='cy-tooltip'>
          <button aria-label='Rerun all tests' className='restart' onClick={emit('restart')}>
            {appState.studioActive ? (
              <RestartIcon transform="scale(-1 1)" />
            ) : (
              <RestartIcon />
            )}
          </button>
        </Tooltip>
      ))}
      {ifThen(!!appState.nextCommandName, (
        <Tooltip placement='bottom' title={<p>Next <span className='kbd'>[N]:</span>{appState.nextCommandName}</p>} className='cy-tooltip'>
          <button aria-label={`Next '${appState.nextCommandName}'`} className='next' onClick={emit('next')}>
            <NextIcon />
          </button>
        </Tooltip>
      ))}
    </div>
  )
})

export default Controls
