import React, { Component } from 'react'
import { Link } from 'react-router'
import { observer } from 'mobx-react'

@observer
class LoginMessage extends Component {
  render () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>Log in to see Builds</h4>
          <p>Aenean lacinia bibendum nulla sed consectetur. Nullam id dolor id nibh ut id elit.</p>
          <p>Praesent commodo cursus magna, vel scelerisque nisl <a href="">ultricies vehicula</a>.</p>
          <div>
            <Link
              className='btn btn-black'
              to='/login'
              >
              <i className='fa fa-sign-in'></i>{' '}
              Log In
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export default LoginMessage
