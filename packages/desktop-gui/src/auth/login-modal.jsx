import { observer } from 'mobx-react'
import React, { Component } from 'react'
import BootstrapModal from 'react-bootstrap-modal'
import Loader from 'react-loader'

import LoginForm from './login-form'
import authStore from './auth-store'
import ipc from '../lib/ipc'

const close = () => {
  authStore.closeLogin()
}

// LoginContent is a separate component so that it pings the api
// server whenever it is displayed
@observer
class LoginContent extends Component {
  state = {
    isLoading: true,
    hasApiServer: false,
    apiUrl: '',
    apiError: null,
    succeeded: false,
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
    if (this.state.succeeded) {
      return this._renderSuccess()
    }

    if (this.state.isLoading) {
      return (
        <div className='modal-body login'>
          <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
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
        <h1><i className='fas fa-lock'></i> Log In</h1>
        <p>Logging in gives you access to the <a onClick={this._openDashboard}>Cypress Dashboard Service</a>. You can set up projects to be recorded and see test data from your project.</p>
        <LoginForm utm='Nav Login Button' onSuccess={() => this.setState({ succeeded: true })} />
      </div>
    )
  }

  _renderSuccess () {
    return (
      <div className='modal-body login'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <h1><i className='fas fa-check'></i> Login Successful</h1>
        <p>You are now logged in{authStore.user ? ` as ${authStore.user.name}` : ''}.</p>
        <div className='login-content'>
          <button
            className='btn btn-login btn-primary btn-wide'
            onClick={close}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  _noApiServer () {
    return (
      <div className='modal-body login login-no-api-server'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <h4><i className='fas fa-wifi'></i> Cannot connect to API server</h4>
        <p>Logging in requires connecting to an external API server. We tried but failed to connect to the API server at <em>{this.state.apiUrl}</em></p>
        <p>
          <button
            className='btn btn-default btn-sm'
            onClick={this._pingApiServer}
          >
            <i className='fas fa-sync-alt'></i>{' '}
            Try again
          </button>
        </p>
        <p>The following error was encountered:</p>
        <pre className='alert alert-danger'><code>{this.state.apiError}</code></pre>
        <a onClick={this._openAPIHelp}>Learn more</a>
      </div>
    )
  }

  _openDashboard () {
    ipc.externalOpen('https://on.cypress.io/dashboard')
  }

  _openAPIHelp () {
    ipc.externalOpen('https://on.cypress.io/help-connect-to-api')
  }
}

const Login = observer(() => (
  <BootstrapModal
    show={authStore.isShowingLogin}
    onHide={close}
    backdrop='static'
  >
    {authStore.isShowingLogin && <LoginContent />}
  </BootstrapModal>
))

export default Login
