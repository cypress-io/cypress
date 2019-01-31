import { observer } from 'mobx-react'
import React from 'react'

const Banner = observer(({ events, filePath }) => {
  const emit = (event) => () => events.emit(event)

  return (
    <div className='banner'>
      <div className='text-container'>
        <p><code>{ filePath }</code> was modified. Please restart Cypress for changes to take effect.</p>
        <button className='restart' onClick={emit('reload:configuration')}>
          <i className='fa fa-refresh'></i>
        Restart
        </button>
      </div>
    </div>
  )
})

export default Banner
