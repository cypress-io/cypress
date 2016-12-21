import cs from 'classnames'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'

@observer
class PermissionMessage extends Component {
  constructor (props) {
    super(props)

    this.state = {
      error: null,
      isSubmitting: false,
      result: null,
    }
  }

  render () {
    return (
      <div
        id='builds-list-page'
        className={cs('request-access', {
          'is-submitting': this.state.isSubmitting,
        })}
      >
        {this._message()}
      </div>
    )
  }

  _message () {
    switch (this.state.result) {
      case 'success':
        return (
          <div className='empty'>
            <h3>Request Sent</h3>
            <p>
              An email will be sent to the project owner to request access to this project's builds.
            </p>
          </div>
        )
      case 'failure':
        return (
          <div className='empty'>
            <h3>Request Failed</h3>
            <p>The following error occurred while requesting access:</p>
            <pre>{this.state.error.message}</pre>
            <p>Try again:</p>
            {this._button()}
          </div>
        )
      default:
        return (
          <div className="empty">
            <h4>
              Request access to see the builds
            </h4>
            <p>This is a private project created by someone else.</p>
            <p>The project owner must give you access to see the builds.</p>
            {this._button()}
          </div>
        )
    }
  }

  _button () {
    return (
      <button
        className='btn btn-primary'
        disabled={this.state.isSubmitting}
        onClick={this._requestAccess}
        >
        <span>
          <i className='fa fa-paper-plane'></i>{' '}
          Request Access
        </span>
        <i className='fa fa-spinner fa-spin'></i>
      </button>
    )
  }

  _requestAccess = () => {
    this.setState({
      isSubmitting: true,
    })

    App.ipc("request:access", this.props.project.orgId)
    .then(() => {
      this._setResult()
    })
    .catch((error) => {
      this._setResult(error)
    })
  }

  _setResult (error) {
    this.setState({
      error,
      isSubmitting: false,
      result: error ? 'failure' : 'success',
    })
  }
}

export default PermissionMessage
