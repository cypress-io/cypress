import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'

import events from '../lib/events'
import Tooltip from '../tooltip/tooltip'

const ifThen = (condition, component) => (
  condition ? component : null
)

const Controls = observer(({ events, appState }) => {
  const emit = (event) => () => events.emit(event)

  return (
    <div className='controls'>
      {ifThen(appState.isPaused, (
        <label className='paused-label'>Paused</label>
      ))}
      {ifThen(appState.isPaused, (
        <Tooltip placement='bottom' title='Resume'>
          <button className='play' onClick={emit('resume')}>
            <i className='fa fa-play'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isPaused, (
        <Tooltip placement='bottom' title={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`}>
          <button
            className={cs('toggle-auto-scrolling', { 'auto-scrolling-enabled': appState.autoScrollingEnabled })}
            onClick={action('toggle:auto:scrolling', () => appState.toggleAutoScrolling())}
          >
            <i className='fa fa-arrow-circle-down fa-large'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(appState.isRunning && !appState.isPaused, (
        <Tooltip placement='bottom' title='Stop Running'>
          <button className='stop' onClick={emit('stop')}>
            <i className='fa fa-stop'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isRunning, (
        <Tooltip placement='bottom' title='Run All Tests'>
          <button className='restart' onClick={emit('restart')}>
            <i className='fa fa-repeat'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!!appState.nextCommandName, (
        <Tooltip placement='bottom' title={`Next: '${appState.nextCommandName}'`}>
          <button className='next' onClick={emit('next')}>
            <i className='fa fa-step-forward'></i>
          </button>
        </Tooltip>
      ))}
    </div>
  )
})

Controls.defaultProps = {
  events,
}

export default Controls
