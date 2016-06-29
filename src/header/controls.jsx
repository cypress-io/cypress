import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import events from '../lib/events'

const Controls = observer(({ stats }) => {
  const emit = (event) => () => events.emit(event)

  return (
    <div
      className={cs('controls', {
        'is-running': stats.isRunning,
        'is-paused': stats.isPaused,
        'has-next': !!stats.nextCommandName,
      })}
    >
      <label className='paused-label'>Paused</label>
      <button className='play' title='Resume' onClick={emit('resume')}>
        <i className='fa fa-play'></i>
      </button>
      <button className='stop' title='Stop Running' onClick={emit('stop')}>
        <i className='fa fa-stop'></i>
      </button>
      <button className='restart' title='Run All Tests' onClick={emit('restart')}>
        <i className='fa fa-repeat'></i>
      </button>
      <button className='next' title={`Next: '${stats.nextCommandName}'`} onClick={emit('next')}>
        <i className='fa fa-step-forward'></i>
      </button>
    </div>
  )
})

export default Controls
