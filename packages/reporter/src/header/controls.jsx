import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

import events from '../lib/events'

const ifThen = (condition, component) => (
  condition ? component : null
)

const Controls = observer(({ events, appState }) => {
  const emit = (event) => () => events.emit(event)
  const toggleAutoScrolling = () => {
    appState.toggleAutoScrolling()
    events.emit('save:state')
  }

  return (
    <div className='controls'>
      {ifThen(appState.isPaused, (
        <span className='paused-label'>
          <label>Paused</label>
        </span>
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
            onClick={action('toggle:auto:scrolling', toggleAutoScrolling)}
          >
            <i className='fa'></i>
            <i className='fa fa-arrows-v'></i>
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
        <Tooltip placement='bottom' title='Run all tests'>
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
