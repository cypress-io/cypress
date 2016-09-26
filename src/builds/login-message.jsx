import React, { Component } from 'react'
import { Link } from 'react-router'
import { observer } from 'mobx-react'

@observer
class LoginMessage extends Component {
  render () {
    return (
      <div id='builds-list-page'>
        <div className="empty-well">
          You Need to Login
          <div>
            <Link
              className='btn btn-login'
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
