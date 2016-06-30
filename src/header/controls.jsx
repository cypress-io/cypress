import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '../lib/tooltip'

import events from '../lib/events'

const Maybe = ({ children, condition }) => (
  condition ? children : null
)

const Controls = observer(({ stats }) => {
  const emit = (event) => () => events.emit(event)

  return (
    <div className='controls'>
      <Maybe condition={stats.isPaused}>
        <label className='paused-label'>Paused</label>
      </Maybe>
      <Maybe condition={stats.isPaused}>
        <Tooltip placement='left' title='Resume'>
          <button className='play' onClick={emit('resume')}>
            <i className='fa fa-play'></i>
          </button>
        </Tooltip>
      </Maybe>
      <Maybe condition={stats.isRunning && !stats.isPaused}>
        <Tooltip placement='left' title='Stop Running'>
          <button className='stop' onClick={emit('stop')}>
            <i className='fa fa-stop'></i>
          </button>
        </Tooltip>
      </Maybe>
      <Maybe condition={!stats.isRunning}>
        <Tooltip placement='left' title='Run All Tests'>
          <button className='restart' onClick={emit('restart')}>
            <i className='fa fa-repeat'></i>
          </button>
        </Tooltip>
      </Maybe>
      <Maybe condition={!!stats.nextCommandName}>
        <Tooltip placement='left' title={`Next: '${stats.nextCommandName}'`}>
          <button className='next' onClick={emit('next')}>
            <i className='fa fa-step-forward'></i>
          </button>
        </Tooltip>
      </Maybe>
    </div>
  )
})

export default Controls
