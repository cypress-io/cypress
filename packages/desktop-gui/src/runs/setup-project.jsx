import _ from 'lodash'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import Loader from 'react-loader'
import Tooltip from '@cypress/react-tooltip'

import OrgSelector from './org-selector'
import ProjectSelector from './project-selector'
import authStore from '../auth/auth-store'
import ipc from '../lib/ipc'
import orgsStore from '../organizations/organizations-store'
import orgsApi from '../organizations/organizations-api'
import dashboardProjectsStore from '../dashboard-projects/dashboard-projects-store'
import dashboardProjectsApi from '../dashboard-projects/dashboard-projects-api'

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
      selectedOrgId: null,
      selectedProjectId: null,
      projectName: this.props.project.displayName,
      newProject: true,
      public: false,
      isSubmitting: false,
    }
  }

  componentDidMount () {
    // this ensures that when orgsStore.orgs updates from polling, we
    // re-evaluate the selected org id
    this._disposeAutorun = autorun(() => {
      if (this.state.selectedOrgId !== this._getSelectedOrgId()) {
        this.setState({
          selectedOrgId: this._getSelectedOrgId(),
        }, this._setNewProject)
      }
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
    if (!orgsApi.isPolling()) {
      orgsApi.getOrgs()
      orgsApi.pollOrgs()
    }

    if (!dashboardProjectsApi.isPolling()) {
      dashboardProjectsApi.getDashboardProjects()
      dashboardProjectsApi.pollDashboardProjects()
    }
  }

  _stopPolling () {
    orgsApi.stopPollingOrgs()
    dashboardProjectsApi.stopPollingDashboardProjects()
  }

  _isLoaded () {
    return orgsStore.isLoaded && dashboardProjectsStore.isLoaded
  }

  render () {
    return (
      <div className='setup-project'>
        <div className='title-wrapper'>
          <h4>Set up project</h4>
          <button className='btn btn-link close' onClick={this.props.onClose}>x</button>
        </div>
        {this._isLoaded() ? this._form() : <Loader color='#888' scale={0.5}/>}
      </div>
    )
  }

  _form () {
    return (
      <form onSubmit={this._submit}>
        {this._ownerSelector()}
        <hr />

        {orgsStore.orgs.length ? this.state.newProject ?
          <>
            {this._newProjectInput()}
            <hr />
            {this._accessSelector()}
          </>
          :
          this._projectSelector()
          :
          null
        }

        {this._error()}
        <div className='actions form-group'>
          <div>
            <button
              disabled={this.state.isSubmitting || this._formNotFilled()}
              className='btn btn-primary btn-block'
            >
              { this.state.isSubmitting && <span><i className='fas fa-spin fa-sync-alt'/>{' '}</span> }
              <span>Set up project</span>
            </button>
          </div>
        </div>
      </form>
    )
  }

  _ownerSelector () {
    return (
      <div className='form-group'>
        <div className='label-title'>
          <label className='control-label pull-left'>
            Who should own this project?
            {' '}
            <a onClick={this._openOrgDocs}>
              <i className='fas fa-question-circle' />
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
              selectedOrgId={this.state.selectedOrgId}
              onUpdateSelectedOrgId={this._updateSelectedOrgId}
              onCreateOrganization={this._openManageOrgs}
            />
          </div>
        </div>
      </div>
    )
  }

  _projectSelector () {
    return (
      <div className='form-group'>
        <div className='label-title'>
          <label className='control-label pull-left'>
            Select a project
          </label>
        </div>
        <div>
          <ProjectSelector
            projects={this._filterDashboardProjects()}
            selectedProjectId={this.state.selectedProjectId}
            onUpdateSelectedProjectId={this._updateSelectedProjectId}
          />
        </div>
        <div className='input-link'><a onClick={this._createNewProject}>Create new project</a></div>
      </div>
    )
  }

  _newProjectInput () {
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
            type='text'
            className='form-control'
            id='projectName'
            value={this.state.projectName}
            onChange={this._updateProjectName}
          />
        </div>
        { !_.isEmpty(this._filterDashboardProjects()) && (
          <div className='input-link'>
            <a onClick={this._chooseExistingProject}>Choose an existing project</a>
          </div>
        )}
      </div>
    )
  }

  _accessSelector () {
    return (
      <div className='privacy-selector'>
        <Tooltip
          title={this.state.public ? 'Anyone has access' : 'Only invited users have access'}
          className='cy-tooltip'
        >
          <span>
            Project visibility is set to {this.state.public ? 'Public' : 'Private'}.{' '}
            <a onClick={this._toggleAccess}>Change</a>{' '}
          </span>
        </Tooltip>
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
    return !this._getSelectedOrgId() || !(this.state.selectedProjectId || (this.state.newProject && this._hasValidProjectName()))
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

  _setNewProject () {
    const newProject = !!this._getSelectedOrgId() && _.isEmpty(this._filterDashboardProjects())

    this.setState({ newProject })
  }

  _filterDashboardProjects () {
    if (!this._getSelectedOrgId()) {
      return []
    }

    return dashboardProjectsStore.getProjectsByOrgId(this._getSelectedOrgId())
  }

  _updateSelectedOrgId = (selectedOrgId) => {
    const orgIsNotSelected = _.isNull(selectedOrgId)

    // reset selected project info when selected org changes
    this.setState({
      selectedOrgId,
      selectedProjectId: null,
      projectName: this.props.project.displayName,
    }, this._setNewProject)

    // deselect their choice for access
    // if they didn't select anything
    if (orgIsNotSelected) {
      this.setState({
        public: null,
      })
    }
  }

  _updateSelectedProjectId = (selectedProjectId) => {
    this.setState({ selectedProjectId })
  }

  _updateProjectName = (e) => {
    this.setState({ projectName: e.target.value })
  }

  _hasValidProjectName () {
    return _.trim(this.state.projectName)
  }

  _hasDefaultOrg () {
    return _.find(orgsStore.orgs, { default: true })
  }

  _createNewProject = (e) => {
    e.preventDefault()
    this.setState({ newProject: true })
  }

  _chooseExistingProject = (e) => {
    e.preventDefault()
    this.setState({ newProject: false })
  }

  _toggleAccess = (e) => {
    e.preventDefault()
    this.setState({ public: !this.state.public })
  }

  _submit = (e) => {
    e.preventDefault()

    if (this.state.isSubmitting || this._formNotFilled()) return

    this.setState({
      isSubmitting: true,
    })

    this._setupProject()
    .then((projectDetails) => {
      this.setState({
        isSubmitting: false,
      })

      this.props.onSetup(projectDetails)

      return null
    })
    .catch((error) => {
      this.setState({
        error,
        isSubmitting: false,
      })
    })
  }

  _setupProject () {
    if (this.state.newProject) {
      return dashboardProjectsApi.setupDashboardProject({
        projectName: this.state.projectName,
        orgId: this.state.selectedOrgId,
        public: this.state.public,
      })
    }

    return dashboardProjectsApi.setProjectId(this.state.selectedProjectId)
    .then((id) => {
      const project = dashboardProjectsStore.getProjectById(id)

      // local cache will not be updated properly unless name is set as projectName
      project.projectName = project.name

      return project
    })
  }
}

export default SetupProject
