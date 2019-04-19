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
        <p className='terms'>By logging in, you agree to the <a onClick={this._openTerms}>Terms of Use</a> and <a onClick={this._openPrivacy}>Privacy Policy</a>.</p>
      </div>
    )
  }

  _buttonContent () {
    if (this.state.isLoggingIn) {
      return (
        <span>
          <i className='fa fa-spinner fa-pulse'></i>{' '}
          Logging in...
        </span>
      )
    }

    return (
      <span>
        <i className='fa fa-github'></i>{' '}
          Log In with GitHub
      </span>
    )

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

  _openTerms () {
    ipc.externalOpen('https://on.cypress.io/terms-of-use')
  }

  _openPrivacy () {
    ipc.externalOpen('https://on.cypress.io/privacy-policy')
  }
}

export default LoginForm
