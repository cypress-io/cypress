import { observer } from 'mobx-react'
import React from 'react'

const Controls = observer(({ stats }) => {
  const config = stats.isRunning ? {
    label: 'Stop Running',
    icon: 'stop',
  } : {
    label: 'Run All Tests',
    icon: 'repeat',
  }

  return (
    <div className='controls'>
      <button title={config.label}>
        <i className={`fa fa-${config.icon}`}></i>
      </button>
    </div>
  )
})

export default Controls
