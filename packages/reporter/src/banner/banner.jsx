import { observer } from 'mobx-react'
import React from 'react'

const Banner = observer(({ filePath }) => (
  <div className='banner'>
    <span>You need to restart Cypress after updating configuration files.</span>
    <span>Changes found in:</span>
    <code>{ filePath }</code>
    <strong>
      <i className='fa fa-refresh'></i>{' '}
      Restart
    </strong>
  </div>
))

export default Banner
