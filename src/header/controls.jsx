import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from 'rc-tooltip'

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
      <Tooltip
        placement='left'
        overlay={config.label}
        align={{ offset: [5, 0] }}
      >
        <button>
          <i className={`fa fa-${config.icon}`}></i>
        </button>
      </Tooltip>
    </div>
  )
})
