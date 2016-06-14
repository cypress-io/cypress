import React from 'react'
import Tooltip from 'react-tooltip'

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
      <button label={config.label} data-tip data-for='tooltip'>
        <i className={`fa fa-${config.icon}`}></i>
      </button>
      <Tooltip
        id='tooltip'
        effect='solid'
        place='bottom'
        class='stop-start'
      >{config.label}</Tooltip>
    </div>
  )
}
