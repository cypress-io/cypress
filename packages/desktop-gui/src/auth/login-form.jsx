import cs from 'classnames'
import React, { Component } from 'react'

import authApi from './auth-api'
import ipc from '../lib/ipc'

class LoginForm extends Component {
  static defaultProps = {
    onSuccess () {},
  }

  state = {
    isLoggingIn: false,
    error: null,
  }

  render () {
    return (
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
        <p className='terms'>By logging in, you agree to the <a href="https://on.cypress.io/terms-of-use">Terms of Use</a> and <a href="https://on.cypress.io/privacy-policy">Privacy Policy</a>.</p>
      </div>
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
      this.props.onSuccess()
    })
    .catch({ windowClosed: true }, () => {
      this.setState({ isLoggingIn: false })
    })
    .catch((error) => {
      this.setState({
        isLoggingIn: false,
        error,
      })
    })
  }

  _openAuthDoc () {
    ipc.externalOpen('https://on.cypress.io/email-not-authorized')
  }
}

export default LoginForm
