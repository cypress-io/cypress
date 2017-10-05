import { observer } from 'mobx-react'
import React, { Component } from 'react'
import BootstrapModal from 'react-bootstrap-modal'

import LoginForm from './login-form'
import authStore from './auth-store'
import ipc from '../lib/ipc'

@observer
class Login extends Component {
  render () {
    return (
      <BootstrapModal
        show={authStore.isShowingLogin}
        onHide={this._close}
        backdrop='static'
      >
        <div className='modal-body login'>
          <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
          <h1><i className='fa fa-lock'></i> Log In</h1>
          <p>Logging in gives you access to the <a onClick={this._openDashboard}>Cypress Dashboard Service</a>. You can set up projects to be recorded and see test data from your project.</p>
          <LoginForm onSuccess={this._close} />
        </div>
      </BootstrapModal>
    )
  }

  _close = () => {
    authStore.setShowingLogin(false)
  }

  _openDashboard () {
    ipc.externalOpen('https://on.cypress.io/dashboard')
  }
}

export default Login
