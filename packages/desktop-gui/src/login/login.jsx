import React, { Component } from 'react'
import { observer } from 'mobx-react'
import cs from 'classnames'

import ipc from '../lib/ipc'
import authStore from '../lib/auth-store'

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
      <div id='login'>
        <div className='login-img-wrapper'>
          <img src='img/cypress-inverse.png' />
        </div>
        <div className='login-content'>
          {this._error()}
          <button
            className={cs('btn btn-login btn-black btn-block', {
              disabled: this.state.isLoggingIn,
            })}
            onClick={this._login}
            disabled={this.state.isLoggingIn}
          >
            <i className='fa fa-github'></i>{' '}
            Log In with GitHub
          </button>
          {this.state.isLoggingIn ?
            <div className='login-spinner'>
              <i className='fa fa-spinner fa-spin'></i>{' '}
              Logging in...
            </div>
            : null}
          <a className='helper-docs-link' onClick={this._openHelp}>
            <i className='fa fa-question-circle'></i>{' '}
            Need help?
          </a>
        </div>
      </div>
    )
  }

  _login = (e) => {
    e.preventDefault()

    const alreadyOpen = (err) => {
      return err && err.alreadyOpen
    }

    ipc.windowOpen({
      position: 'center',
      focus: true,
      width: 1000,
      height: 635,
      preload: false,
      title: 'Login',
      type: 'GITHUB_LOGIN',
    })
    .then((code) => {
      // TODO: supposed to focus the window here!
      // i think this is for linux
      // App.execute 'gui:focus'
      this.setState({ isLoggingIn: true })

      return ipc.logIn(code)
    })
    .then((user) => {
      authStore.setUser(user)
      return null
    })
    .catch(alreadyOpen, () => {
      return // do nothing if we're already open!
    })
    .catch((err) => {
      this.setState({
        isLoggingIn: false,
        error: err,
      })
    })
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

  _openHelp () {
    ipc.externalOpen('https://on.cypress.io/logging-in')
  }

  _openAuthDoc () {
    ipc.externalOpen('https://on.cypress.io/email-not-authorized')
  }
}

export default Login
