import cs from 'classnames'
import React, { Component } from 'react'

import authApi from './auth-api'
import ipc from '../lib/ipc'
import MarkdownRenderer from '../lib/markdown-renderer'

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
        {this.props.warning && <p className='warning'><MarkdownRenderer markdown={this.props.warning}/></p>}
        <p className='terms'>By logging in, you agree to the <a onClick={this._openTerms}>Terms of Use</a> and <a onClick={this._openPrivacy}>Privacy Policy</a>.</p>
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
    }

    return (
      <span>
          Log In to Dashboard
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
