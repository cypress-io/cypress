import cs from 'classnames'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import errors from '../lib/errors'
import orgsStore from '../organizations/organizations-store'

const SUCCESS = 'SUCCESS'
const FAILURE = 'FAILURE'

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
    const membershipRequested = orgsStore.wasMembershipRequested(this.props.project.orgId)

    if (this.state.result === SUCCESS || membershipRequested) {
      return this._success()
    } else if (this.state.result === FAILURE) {
      return this._failure()
    } else {
      return this._noResult()
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

  _success () {
    return (
      <div className='empty'>
        <h3>Request Sent</h3>
        <p>
          An email will be sent to the project owner to request access to this project's builds.
        </p>
      </div>
    )
  }

  _failure () {
    const error = this.state.error

    // if they're denied or the request has already been made,
    // tell them it's all good
    if (errors.isDenied(error) || errors.isAlreadyRequested(error)) {
      return this._success()
    } else {
      return (
        <div className='empty'>
          <h3>Request Failed</h3>
          <p>The following error occurred while requesting access:</p>
          <pre className='alert alert-danger'>
            {this.state.error.message}
          </pre>
          <p>Try again:</p>
          {this._button()}
        </div>
      )
    }
  }

  _noResult () {
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

  _requestAccess = () => {
    this.setState({
      isSubmitting: true,
    })

    const orgId = this.props.project.orgId

    App.ipc("request:access", orgId)
    .then((response = {}) => {
      orgsStore.membershipRequested(orgId)
      if (response.alreadyMember) {
        this.props.onRetry()
      } else {
        this._setResult()
      }
    })
    .catch((error) => {
      this._setResult(error)
    })
  }

  _setResult (error) {
    this.setState({
      error,
      isSubmitting: false,
      result: error ? FAILURE : SUCCESS,
    })
  }
}

export default PermissionMessage
