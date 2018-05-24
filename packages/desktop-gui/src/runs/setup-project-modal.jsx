import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'
import Loader from 'react-loader'

import authStore from '../auth/auth-store'
import ipc from '../lib/ipc'
import { gravatarUrl } from '../lib/utils'
import orgsStore from '../organizations/organizations-store'
import orgsApi from '../organizations/organizations-api'

import LoginForm from '../auth/login-form'

@observer
class SetupProject extends Component {
  static propTypes = {
    project: PropTypes.object,
    onSetup: PropTypes.func.isRequired,
  }

  constructor (...args) {
    super(...args)

    this.state = {
      error: null,
      projectName: this.props.project.displayName,
      public: null,
      owner: null,
      orgId: null,
      showNameMissingError: false,
      isSubmitting: false,
    }
  }

  componentDidMount () {
    this._handlePolling()
  }

  componentDidUpdate () {
    this._handlePolling()
  }

  componentWillUnmount () {
    this._stopPolling()
  }

  _handlePolling () {
    if (this._shouldPoll()) {
      this._poll()
    } else {
      this._stopPolling()
    }
  }

  _shouldPoll () {
    return authStore.isAuthenticated
  }

  _poll () {
    if (orgsApi.isPolling()) return

    orgsApi.getOrgs()
    orgsApi.pollOrgs()
  }

  _stopPolling () {
    orgsApi.stopPollingOrgs()
  }

  render () {
    if (!authStore.isAuthenticated) {
      return this._loginMessage()
    }

    if (!orgsStore.isLoaded) {
      this._loading()
    }

    return (
      <div className='setup-project-modal modal-body os-dialog'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <h4>Set up project</h4>
        <form
          onSubmit={this._submit}>
          {this._nameField()}
          <hr />
          {this._ownerSelector()}
          {this._accessSelector()}
          {this._error()}
          <div className='actions form-group'>
            <div className='pull-right'>
              <button
                disabled={this.state.isSubmitting || this._formNotFilled()}
                className='btn btn-primary btn-block'
              >
                {
                  this.state.isSubmitting ?
                    <span><i className='fa fa-spin fa-refresh'></i>{' '}</span> :
                    null
                }
                <span>Set up project</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  _loginMessage () {
    return (
      <div className='login modal-body'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <h1><i className='fa fa-lock'></i> Log in</h1>
        <p>Logging in gives you access to the <a onClick={this._openDashboard}>Cypress Dashboard Service</a>. You can set up projects to be recorded and see test data from your project.</p>
        <LoginForm />
      </div>
    )
  }

  _loading () {
    return (
      <div className='setup-project-modal modal-body os-dialog'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <Loader color='#888' scale={0.5} />
      </div>
    )
  }

  _nameField () {
    return (
      <div className='form-group'>
        <div className='label-title'>
          <label htmlFor='projectName' className='control-label pull-left'>
            What's the name of the project?
          </label>
          <p className='help-block pull-right'>(You can change this later)</p>
        </div>
        <div>
          <input
            autoFocus='true'
            ref='projectName'
            type='text'
            className='form-control'
            id='projectName'
            value={this.state.projectName}
            onChange={this._updateProjectName}
          />
        </div>
        <div className='help-block validation-error'>Please enter a project name</div>
      </div>
    )
  }

  _ownerSelector () {
    return (
      <div className='form-group'>
        <div className='label-title'>
          <label htmlFor='projectName' className='control-label pull-left'>
            Who should own this project?
            {' '}
            <a onClick={this._openOrgDocs}>
              <i className='fa fa-question-circle'></i>
            </a>
          </label>
        </div>
        <div className='owner-parts'>
          <div>
            <div className='btn-group' data-toggle='buttons'>
              <label className={cs('btn btn-default', {
                'active': this.state.owner === 'me',
              })}>
                <input
                  type='radio'
                  name='owner-toggle'
                  id='me'
                  autoComplete='off'
                  value='me'
                  checked={this.state.owner === 'me'}
                  onChange={this._updateOwner}
                />
                <img
                  className='user-avatar'
                  height='13'
                  width='13'
                  src={`${gravatarUrl(authStore.user && authStore.user.email)}`}
                />
                {' '}Me
              </label>
              <label className={`btn btn-default ${this.state.owner === 'org' ? 'active' : ''}`}>
                <input
                  type='radio'
                  name='owner-toggle'
                  id='org'
                  autoComplete='off'
                  value='org'
                  checked={this.state.owner === 'org'}
                  onChange={this._updateOwner}
                />
                <i className='fa fa-building-o'></i>
                {' '}An Organization
              </label>
            </div>
          </div>
          <div className='select-orgs'>
            <div className={cs({ 'hidden': this.state.owner !== 'org' || this._hasOrgsOtherThanDefault() })}>
              <div className='empty-select-orgs well'>
                <p>You don't have any organizations yet.</p>
                <p>Organizations can help you manage projects, including billing.</p>
                <p>
                  <a
                    href='#'
                    className={cs('btn btn-link', { 'hidden': this.state.owner !== 'org' })}
                    onClick={this._manageOrgs}>
                    <i className='fa fa-plus'></i>{' '}
                    Create organization
                  </a>
                </p>
              </div>
            </div>
            {this._orgSelector()}
          </div>
        </div>
      </div>
    )
  }

  _hasOrgsOtherThanDefault () {
    return orgsStore.orgs.length > 1
  }

  _orgSelector () {
    return (
      <div className={cs({ 'hidden': this.state.owner !== 'org' || !(this._hasOrgsOtherThanDefault()) })}>
        <select
          ref='orgId'
          id='organizations-select'
          className='form-control float-left'
          value={this.state.orgId || ''}
          onChange={this._updateOrgId}
        >
          <option value=''>-- Select organization --</option>
          {_.map(orgsStore.orgs, (org) => {
            if (org.default) return null

            return (
              <option
                key={org.id}
                value={org.id}
              >
                {org.name}
              </option>
            )
          })}
        </select>
        <a
          href='#'
          className='btn btn-link manage-orgs-btn float-left'
          onClick={this._manageOrgs}>
          (manage organizations)
        </a>
      </div>
    )
  }

  _accessSelector () {
    return (
      <div className={cs({ 'hidden': !this.state.orgId })}>
        <hr />
        <label htmlFor='projectName' className='control-label'>
          Who should see the runs and recordings?
          {' '}
          <a onClick={this._openAccessDocs}>
            <i className='fa fa-question-circle'></i>
          </a>
        </label>
        <div className='radio privacy-radio'>
          <label>
            <input
              type='radio'
              name='privacy-radio'
              value='true'
              checked={(this.state.public === true)}
              onChange={this._updateAccess}
            />
            <p>
              <i className='fa fa-eye'></i>{' '}
              <strong>Public:</strong>{' '}
              Anyone has access.
            </p>
          </label>
        </div>
        <div className='radio privacy-radio'>
          <label>
            <input
              type='radio'
              name='privacy-radio'
              value='false'
              checked={(this.state.public === false)}
              onChange={this._updateAccess}
            />
            <p>
              <i className='fa fa-lock'></i>{' '}
              <strong>Private:</strong>{' '}
              Only invited users have access.
            </p>
          </label>
        </div>
      </div>
    )
  }

  _openOrgDocs = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/what-are-organizations')
  }

  _openAccessDocs = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/what-is-project-access')
  }

  _manageOrgs = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/dashboard/organizations')
  }

  _formNotFilled () {
    return _.isNull(this.state.public) || !this.state.projectName
  }

  _error () {
    const error = this.state.error
    if (!error) return null

    return (
      <div>
        <p className='text-danger'>An error occurred setting up your project:</p>
        <pre className='alert alert-danger'>{error.message}</pre>
      </div>
    )
  }

  _updateOrgId = () => {
    const orgIsNotSelected = this.refs.orgId.value === '-- Select Organization --'

    const orgId = orgIsNotSelected ? null : this.refs.orgId.value

    this.setState({
      orgId,
    })

    // deselect their choice for access
    // if they didn'tselect anything
    if (orgIsNotSelected) {
      this.setState({
        public: null,
      })
    }
  }

  _updateProjectName = () => {
    this.setState({
      projectName: this.refs.projectName.value,
    })
  }

  _hasValidProjectName () {
    return _.trim(this.state.projectName)
  }

  _updateOwner = (e) => {
    let owner = e.target.value

    // if they clicked the same radio button that's
    // already selected, then ignore it
    if (this.state.owner === owner) return

    const defaultOrg = _.find(orgsStore.orgs, { default: true })

    let chosenOrgId = owner === 'me' ? defaultOrg.id : null

    // we want to clear all selects below the radio buttons
    // otherwise it looks jarring to already have selects
    this.setState({
      owner,
      orgId: chosenOrgId,
      public: null,
    })
  }

  _updateAccess = (e) => {
    this.setState({
      public: e.target.value === 'true',
    })
  }

  _submit = (e) => {
    e.preventDefault()

    if (this.state.isSubmitting) return

    if (this._hasValidProjectName()) {
      this.setState({
        isSubmitting: true,
      })
      this._setupProject()
    } else {
      this.setState({
        showNameMissingError: true,
      })
    }
  }

  _setupProject () {
    ipc.setupDashboardProject({
      projectName: this.state.projectName,
      orgId: this.state.orgId,
      public: this.state.public,
    })
    .then((projectDetails) => {
      this.setState({
        isSubmitting: false,
      })
      this.props.onSetup(projectDetails)
      return null
    })
    .catch(ipc.isUnauthed, ipc.handleUnauthed)
    .catch((error) => {
      this.setState({
        error,
        isSubmitting: false,
      })
    })
  }
}

export default SetupProject
