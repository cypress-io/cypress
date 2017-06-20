import React, { Component } from 'react'

export default class ApplyingUpdates extends Component {

  render () {
    return (
      <div id='login'>
        <div className='login-img-wrapper'>
          <img src='img/cypress-inverse.png' />
        </div>
        <div className='login-content'>
          <div className='login-spinner'>
            <i className='fa fa-spinner fa-spin'></i>{' '}
            Applying updates and restarting...
          </div>
        </div>
      </div>
    )
  }
}
