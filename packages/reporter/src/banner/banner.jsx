import { observer } from 'mobx-react'
import React from 'react'

const Banner = observer(({ filePath }) => (
  <div className='banner'>
    <div className='text-container'>
      <div>
        <p>You need to restart Cypress after updating configuration files.</p>
        <p>Changes found in: <code>{ filePath }</code></p>
      </div>
      <br />
      <strong>
        <i className='fa fa-refresh'></i>{' '}
        Restart
      </strong>
    </div>
  </div>
))

export default Banner
