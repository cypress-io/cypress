import { observer } from 'mobx-react'
import React from 'react'

import statsStore from './stats-store'

export default observer(() => {
  const config = statsStore.isRunning ? {
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
