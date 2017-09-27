import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import BootstrapModal from 'react-bootstrap-modal'

import authApi from './auth-api'
import authStore from './auth-store'
import ipc from '../lib/ipc'

@observer
class Login extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isLoggingIn: false,
      error: null,
    }
  }

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
          <div className='login-content'>
            {this._error()}
            <button
              className={cs('btn btn-login btn-black btn-block', {
                disabled: this.state.isLoggingIn,
              })}
              onClick={this._login}
              disabled={this.state.isLoggingIn}
            >
              {this._buttonContent()}
            </button>
            <a className='helper-docs-link' onClick={this._openHelp}>
              <i className='fa fa-question-circle'></i>{' '}
              Need help?
            </a>
          </div>
        </div>
      </BootstrapModal>
    )
  }

  _buttonContent () {
    if (this.state.isLoggingIn) {
      return (
        <span>
          <i className='fa fa-spinner fa-spin'></i>{' '}
          Logging in...
        </span>
      )
    } else {
      return (
        <span>
          <i className='fa fa-github'></i>{' '}
          Log In with GitHub
        </span>
      )
    }
  }

  _error () {
    const error = this.state.error
    if (!error) return null

    return (
      <div className='alert alert-danger'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>Can't Log In</strong>
        </p>
        <p>{this._errorMessage(error.message)}</p>
        {error.statusCode === 401 ?
          <p>
            <a onClick={this._openAuthDoc}>
              <i className='fa fa-question-circle'></i>{' '}
              Why am I not authorized?
            </a>
          </p>
          : null}
      </div>
    )
  }

  _errorMessage (message) {
    function createMarkup () {
      return {
        __html: message.replace('\n', '<br /><br />'),
      }
    }

    return (
      <span dangerouslySetInnerHTML={createMarkup()} />
    )
  }

  _login = (e) => {
    e.preventDefault()

    this.setState({ isLoggingIn: true })

    authApi.login()
    .then(() => {
      this.setState({ isLoggingIn: false })
      this._close()
    })
    .catch((error) => {
      this.setState({
        isLoggingIn: false,
        error,
      })
    })
  }

  _close = () => {
    authStore.setShowingLogin(false)
  }

  _openDashboard () {
    ipc.externalOpen('https://on.cypress.io/dashboard')
  }

  _openHelp () {
    ipc.externalOpen('https://on.cypress.io/logging-in')
  }

  _openAuthDoc () {
    ipc.externalOpen('https://on.cypress.io/email-not-authorized')
  }
}

export default Login
