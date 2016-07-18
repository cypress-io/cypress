import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '../tooltip/tooltip'

import events from '../lib/events'

const ifThen = (condition, component) => (
  condition ? component : null
)

const Controls = observer(({ events, stats }) => {
  const emit = (event) => () => events.emit(event)

  return (
    <div className='controls'>
      {ifThen(stats.isPaused, (
        <label className='paused-label'>Paused</label>
      ))}
      {ifThen(stats.isPaused, (
        <Tooltip placement='bottom' title='Resume'>
          <button className='play' onClick={emit('resume')}>
            <i className='fa fa-play'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(stats.isRunning && !stats.isPaused, (
        <Tooltip placement='bottom' title='Stop Running'>
          <button className='stop' onClick={emit('stop')}>
            <i className='fa fa-stop'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!stats.isRunning, (
        <Tooltip placement='bottom' title='Run All Tests'>
          <button className='restart' onClick={emit('restart')}>
            <i className='fa fa-repeat'></i>
          </button>
        </Tooltip>
      ))}
      {ifThen(!!stats.nextCommandName, (
        <Tooltip placement='bottom' title={`Next: '${stats.nextCommandName}'`}>
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
