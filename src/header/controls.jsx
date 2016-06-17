import React from 'react'
import Tooltip from 'rc-tooltip'

export default (props) => {
  const config = props.isRunning ? {
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
}
