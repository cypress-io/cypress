import { observer } from 'mobx-react'
import React from 'react'

const Banner = observer(({ events, filePath }) => {
  const emit = (event) => events.emit(event)

  return (
    <div className='banner'>
      <div className='text-container'>
        <p>This file was changed: <code>{ filePath }</code></p>
        <p>Please restart Cypress for changes to take effect.</p>
        <br />
        <button className='restart' onClick={emit('reload:configuration')}>
          <i className='fa fa-refresh'></i>{' '}
        Restart
        </button>
      </div>
    </div>
  )
})

export default Banner
