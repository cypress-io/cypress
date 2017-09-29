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
          <h3>Log In</h3>
          <p>Logging in isn't required for normal usage of Cypress, but provides access to data from the <a onClick={this._openDashboard}>Cypress Dashboard</a>, so you can view the recorded runs for the current project.</p>
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
