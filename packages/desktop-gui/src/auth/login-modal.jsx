import { observer } from 'mobx-react'
import React, { Component } from 'react'
import BootstrapModal from 'react-bootstrap-modal'
import Loader from 'react-loader'

import LoginForm from './login-form'
import authStore from './auth-store'
import ipc from '../lib/ipc'

@observer
class Login extends Component {
  state = {
    isLoading: true,
    hasApiServer: false,
    apiUrl: '',
    apiError: null,
  }

  componentDidMount () {
    this._pingApiServer()
  }

  _pingApiServer = () => {
    this.setState({ isLoading: true })

    ipc.pingApiServer()
    .then(() => {
      this.setState({
        apiError: null,
        hasApiServer: true,
        isLoading: false,
      })
    })
    .catch(({ apiUrl, message }) => {
      this.setState({
        apiError: message,
        apiUrl,
        isLoading: false,
      })
    })
  }

  render () {
    return (
      <BootstrapModal
        show={authStore.isShowingLogin}
        onHide={this._close}
        backdrop='static'
      >
        {this._content()}
      </BootstrapModal>
    )
  }

  _content () {
    if (this.state.isLoading) {
      return (
        <div className='modal-body login'>
          <Loader color='#888' scale={0.5}/>
        </div>
      )
    }

    if (!this.state.hasApiServer) {
      return this._noApiServer()
    }

    return (
      <div className='modal-body login'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <h1><i className='fa fa-lock'></i> Log In</h1>
        <p>Logging in gives you access to the <a onClick={this._openDashboard}>Cypress Dashboard Service</a>. You can set up projects to be recorded and see test data from your project.</p>
        <LoginForm onSuccess={this._close} />
      </div>
    )
  }

  _noApiServer () {
    return (
      <div className='modal-body login login-no-api-server'>
        <h4>Cannot connect to API server</h4>
        <p>Logging in requires connecting to an external API server.</p>
        <p>We tried but failed to connect to the API server at <em>{this.state.apiUrl}</em></p>
        <p>
          <button
            className='btn btn-default btn-sm'
            onClick={this._pingApiServer}
          >
            <i className='fa fa-refresh'></i>{' '}
            Try Again
          </button>
        </p>
        <p>The following error was encountered:</p>
        <pre className='alert alert-danger'><code>{this.state.apiError}</code></pre>
      </div>
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
