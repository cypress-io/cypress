import { IAction } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '../lib/events'
import { AppState } from '../lib/app-state'

const ifThen = (condition: boolean, component: React.ReactNode) => (
  condition ? component : null
)

interface Props {
  events?: Events
  appState: AppState
  isShowingOptions: boolean
  onToggleOptions: (() => void) & IAction
}

const Controls = observer(({ events = defaultEvents, appState, isShowingOptions, onToggleOptions }: Props) => {
  const emit = (event: string) => () => events.emit(event)

  const optionsLabel = `${isShowingOptions ? 'Hide' : 'Show'} Options`

  return (
    <div className='controls'>
      {ifThen(appState.isPaused, (
        <span className='paused-label'>
          <label>Paused</label>
        </span>
      ))}
      {ifThen(appState.isPaused, (
        <Tooltip placement='bottom' title='Resume'>
          <button aria-label='Resume' className='play' onClick={emit('resume')}>
            <i className='fas fa-play'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isPaused, (
        <Tooltip placement='bottom' title={optionsLabel}>
          <button aria-label={optionsLabel} className='toggle-options' onClick={onToggleOptions}>
            <i className='fas fa-sliders-h'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(appState.isRunning && !appState.isPaused, (
        <Tooltip placement='bottom' title={<p>Stop Running <span className='kbd'>S</span></p>}>
          <button aria-label='Stop' className='stop' onClick={emit('stop')}>
            <i className='fas fa-stop'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isRunning, (
        <Tooltip placement='bottom' title={<p>Run All Tests <span className='kbd'>R</span></p>}>
          <button aria-label='Rerun all tests' className='restart' onClick={emit('restart')}>
            <i className='fas fa-redo'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!!appState.nextCommandName, (
        <Tooltip placement='bottom' title={`Next: '${appState.nextCommandName}'`}>
          <button aria-label={`Next: '${appState.nextCommandName}'`} className='next' onClick={emit('next')}>
            <i className='fas fa-step-forward'></i>
          </button>
        </Tooltip>
      ))}
    </div>
  )
})

export default Controls
