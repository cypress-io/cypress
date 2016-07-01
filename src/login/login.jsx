import cs from 'classnames'
import { action } from 'mobx'
import React, { Component } from 'react'
import App from '../lib/app'
import state from '../lib/state'

export default class Login extends Component {
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
        <h3>Welcome to Cypress!</h3>
        <p>Let's get a project setup to test in Cypress. It only takes a couple of minutes.</p>
        <p>First, log in with your GitHub account.</p>
        {this._error()}
        <button
          className={cs('btn btn-primary btn-login', {
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
        : null }
        <div className='helper-line'>
          <a className='helper-docs-link' onClick={this._openHelp}>
            <i className='fa fa-question-circle'></i>{' '}
            Need help?
          </a>
        </div>
      </div>
    )
  }

  _login = () => {
    const alreadyOpen = (err) => err && err.alreadyOpen

    App.ipc("window:open", {
      position: "center",
      focus: true,
      width: 1000,
      height: 635,
      preload: false,
      title: "Login",
      type: "GITHUB_LOGIN",
    })
    .then((code) => {
      // TODO: supposed to focus the window here!
      // i think this is for linux
      // App.execute "gui:focus"
      this.setState({ isLoggingIn: true })

      return App.ipc("log:in", code)
    })
    .then(action('log:in', (user) => {
      state.setUser(user)
    }))
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
        <p>{error.message}</p>
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

  _openHelp () {
    App.ipc('external:open', 'https://docs.cypress.io')
  }

  _openAuthDoc () {
    App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running#section-your-email-has-not-been-authorized-')
  }
}
