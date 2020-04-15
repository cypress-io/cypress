import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import OrgSelector from './org-selector'
import authStore from '../auth/auth-store'
import ipc from '../lib/ipc'
import orgsStore from '../organizations/organizations-store'
import orgsApi from '../organizations/organizations-api'

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
      selectedOrgId: null,
      showNameMissingError: false,
      isSubmitting: false,
    }
  }

  componentDidMount () {
    // this ensures that when orgsStore.orgs updates from polling, we
    // re-evaluate the selected org id
    this._disposeAutorun = autorun(() => {
      this.setState({
        selectedOrgId: this._getSelectedOrgId(),
      })
    })

    this._handlePolling()
  }

  componentDidUpdate () {
    this._handlePolling()
  }

  componentWillUnmount () {
    this._disposeAutorun()
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
      authStore.openLogin()

      return null
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
            <div>
              <button
                disabled={this.state.isSubmitting || this._formNotFilled()}
                className='btn btn-primary btn-block'
              >
                {
                  this.state.isSubmitting ?
                    <span><i className='fas fa-spin fa-sync-alt'></i>{' '}</span> :
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
            autoFocus={true}
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
              <i className='fas fa-question-circle'></i>
            </a>

          </label>
          <a
            href='#'
            className='btn btn-link manage-orgs-btn pull-right'
            onClick={this._openManageOrgs}>
            Manage organizations
          </a>
        </div>
        <div className='owner-parts'>
          <div className='select-orgs'>
            <OrgSelector
              orgs={orgsStore.orgs}
              isLoaded={orgsStore.isLoaded}
              selectedOrgId={this.state.selectedOrgId}
              onUpdateSelectedOrgId={this._updateSelectedOrgId}
              onCreateOrganization={this._openManageOrgs}
            />
          </div>
        </div>
      </div>
    )
  }

  _hasOrgs () {
    return orgsStore.orgs.length
  }

  _accessSelector () {
    return (
      <div className={cs({ 'hidden': !this._hasOrgs() })}>
        <hr />
        <label htmlFor='projectName' className='control-label'>
          Who should see the runs and recordings?
          {' '}
          <a onClick={this._openAccessDocs}>
            <i className='fas fa-question-circle'></i>
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
              <i className='far fa-eye'></i>{' '}
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
              <i className='fas fa-lock'></i>{' '}
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

  _openManageOrgs = (e) => {
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

  _getSelectedOrgId () {
    const orgs = orgsStore.orgs

    if (!orgs.length) {
      return null
    }

    if (this.state.selectedOrgId) {
      return this.state.selectedOrgId
    }

    const defaultOrg = _.find(orgs, { default: true })

    if (defaultOrg) {
      return defaultOrg.id
    }

    return orgs[0].id
  }

  _updateSelectedOrgId = (selectedOrgId) => {
    const orgIsNotSelected = _.isNull(selectedOrgId)

    this.setState({
      selectedOrgId,
    })

    // deselect their choice for access
    // if they didn't select anything
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

  _hasDefaultOrg () {
    return _.find(orgsStore.orgs, { default: true })
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
      orgId: this.state.selectedOrgId,
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
