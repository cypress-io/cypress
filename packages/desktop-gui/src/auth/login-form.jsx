import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import authApi from './auth-api'
import authStore from './auth-store'
import MarkdownRenderer from '../lib/markdown-renderer'

@observer
class LoginForm extends Component {
  static defaultProps = {
    onSuccess () {},
    buttonClassName: 'btn btn-login btn-primary btn-wide',
    buttonContent: 'Log In to Dashboard',
  }

  state = {
    isLoggingIn: false,
    error: null,
  }

  render () {
    const { message } = authStore
    const { buttonClassName } = this.props

    return (
      <div className='login-content'>
        {this._error()}
        <div className='button-wrapper'>
          <button
            className={cs(buttonClassName, {
              disabled: this.state.isLoggingIn,
            })}
            onClick={this._login}
            disabled={this.state.isLoggingIn}
          >
            {this._buttonContent(message)}
          </button>
        </div>
        {
          message && <p className={`message ${message.type}`} onClick={this._selectUrl}>
            <MarkdownRenderer markdown={message.message}/>
          </p>
        }
      </div>
    )
  }

  _selectUrl () {
    const selection = window.getSelection()

    if (selection.rangeCount > 0) {
      selection.removeAllRanges()
    }

    const range = document.createRange()

    range.selectNodeContents(document.querySelector('.login-content .message pre'))
    selection.addRange(range)
  }

  _buttonContent (message) {
    if (this.state.isLoggingIn) {
      if (message && message.name === 'AUTH_COULD_NOT_LAUNCH_BROWSER') {
        return (
          <span>
            <i className='fas fa-exclamation-triangle' />{' '}
            Could not open browser.
          </span>
        )
      }

      return (
        <span>
          <i className='fas fa-spinner fa-spin' />{' '}
          {message && message.browserOpened ? 'Waiting for browser login...' : 'Opening browser...'}
        </span>
      )
    }

    return (
      <span>
        {this.props.buttonContent}
      </span>
    )
  }

  _error () {
    const error = this.state.error

    if (!error) return null

    return (
      <div className='alert alert-danger'>
        <p>
          <i className='fas fa-exclamation-triangle' />{' '}
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

    authApi.login(this.props.utm)
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
}

export default LoginForm
