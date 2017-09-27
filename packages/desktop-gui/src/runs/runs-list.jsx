import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import authStore from '../auth/auth-store'
import RunsStore from './runs-store'
import errors from '../lib/errors'
import runsApi from './runs-api'
import projectsApi from '../projects/projects-api'
import Project from '../project/project-model'
import orgsStore from '../organizations/organizations-store'
import Run from './runs-list-item'
import ErrorMessage from './error-message'
import PermissionMessage from './permission-message'
import ProjectNotSetup from './project-not-setup'

@observer
class RunsList extends Component {
  state = {
    recordKey: null,
  }

  componentWillMount () {
    this.runsStore = new RunsStore()

    this._getRuns()
    this._handlePolling()
    this._getKey()
  }

  componentDidUpdate () {
    this._getKey()
    this._handlePolling()
  }

  componentWillUnmount () {
    this._stopPolling()
  }

  _getRuns = () => {
    runsApi.loadRuns(this.runsStore)
  }

  _handlePolling () {
    if (this._shouldPollRuns()) {
      this._poll()
    } else {
      this._stopPolling()
    }
  }

  _shouldPollRuns () {
    return (
      authStore.isAuthenticated &&
      !!this.props.project.id
    )
  }

  _poll () {
    runsApi.pollRuns(this.runsStore)
  }

  _stopPolling () {
    runsApi.stopPollingRuns()
  }

  _getKey () {
    if (this._needsKey()) {
      projectsApi.getRecordKeys().then((keys = []) => {
        if (keys.length) {
          this.setState({ recordKey: keys[0].id })
        }
      })
    }
  }

  _needsKey () {
    return (
      !this.state.recordKey &&
      authStore.isAuthenticated &&
      !this.runsStore.isLoading &&
      !this.runsStore.error &&
      !this.runsStore.runs.length &&
      this.props.project.id
    )
  }

  render () {
    const { project } = this.props

    // not logged in
    if (!authStore.isAuthenticated) {
      return this._loginMessage()
    }

    // If the project is invalid
    if (project.isInvalid) {
      return this._emptyWithoutSetup(false)
    }

    // OR if user does not have acces to the project
    if (project.isUnauthorized) {
      return this._permissionMessage()
    }

    // OR if there is an error getting the runs
    if (this.runsStore.error) {
      // project id missing, probably removed manually from cypress.json
      if (errors.isMissingProjectId(this.runsStore.error)) {
        return this._emptyWithoutSetup()

      // the project is invalid
      } else if (errors.isNotFound(this.runsStore.error)) {
        return this._emptyWithoutSetup(false)

      // they are not authorized to see runs
      } else if (errors.isUnauthenticated(this.runsStore.error) || errors.isUnauthorized(this.runsStore.error)) {
        return this._permissionMessage()

      // other error, but only show if we don't already have runs
      } else if (!this.runsStore.isLoaded) {
        return <ErrorMessage error={this.runsStore.error} />
      }
    }

    // OR the runs are loading for the first time
    if (this.runsStore.isLoading && !this.runsStore.isLoaded) return <Loader color='#888' scale={0.5}/>

    // OR there are no runs to show
    if (!this.runsStore.runs.length) {

      // AND they've never setup CI
      if (!project.id) {
        return this._emptyWithoutSetup()

      // OR they have setup CI
      } else {
        return this._empty()
      }
    }
    //--------End Run States----------//

    // everything's good, there are runs to show!
    return (
      <div className='runs'>
        <header>
          <h5>Runs
            <a href="#" className='btn btn-sm see-all-runs' onClick={this._openRuns}>
            See All <i className='fa fa-external-link'></i>
            </a>

          </h5>
          <div>
            {this._lastUpdated()}
            <button
              className='btn btn-link btn-sm'
              disabled={this.runsStore.isLoading}
              onClick={this._getRuns}
            >
              <i className={`fa fa-refresh ${this.runsStore.isLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </header>
        <ul className='runs-container list-as-table'>
          {_.map(this.runsStore.runs, (run) => (
            <Run
              key={run.id}
              goToRun={this._openRun}
              run={run}
            />
          ))}
        </ul>
      </div>
    )
  }

  _lastUpdated () {
    if (!this.runsStore.lastUpdated) return null

    return (
      <span className='last-updated'>
        Last updated: {this.runsStore.lastUpdated}
      </span>
    )
  }

  _loginMessage () {
    const showLogin = () => {
      authStore.setShowingLogin(true)
    }

    return (
      <div className='empty empty-log-in'>
        <h4>Please Log In to View Runs</h4>
        <p>Cypress can record screenshots, videos and failures when running <code>cypress run</code>, but you must be logged in to view them.</p>
        <div className='runs-screenshots'>
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-1' />
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-2' />
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-3' />
        </div>
        <p>After runs are recorded, you will see them here and on your <a href='#' onClick={this._visitDashboard}>Cypress Dashboard</a>.</p>
        <button
          className='btn btn-primary'
          onClick={showLogin}
        >
          <i className='fa fa-user'></i>{' '}
          Log In
        </button>
      </div>
    )
  }

  _emptyWithoutSetup (isValid = true) {
    return (
      <ProjectNotSetup
        project={this.props.project}
        isValid={isValid}
        onSetup={this._setProjectDetails}
      />
    )
  }

  _permissionMessage () {
    return (
      <PermissionMessage
        project={this.props.project}
        onRetry={this._getRuns}
      />
    )
  }

  _setProjectDetails = (projectDetails) => {
    this.runsStore.setError(null)
    projectsApi.updateProject(this.props.project, {
      id: projectDetails.id,
      name: projectDetails.projectName,
      public: projectDetails.public,
      orgId: projectDetails.orgId,
      orgName: (orgsStore.getOrgById(projectDetails.orgId) || {}).name,
      state: Project.VALID,
    })
  }

  _empty () {
    return (
      <div>
        <div className='first-run-instructions'>
          <h4>
            To record your first run...
          </h4>
          <h5>
            <span className='pull-left'>
              1. Check <code>cypress.json</code> into source control.
            </span>
            <a onClick={this._openProjectIdGuide} className='pull-right'>
              <i className='fa fa-question-circle'></i>{' '}
              {' '}
              Why?
            </a>
          </h5>
          <pre className='line-nums'>
            <span>{'{'}</span>
            <span>{`  "projectId": "${this.props.project.id || '<projectId>'}"`}</span>
            <span>{'}'}</span>
          </pre>
          <h5>
            <span className='pull-left'>
              2. Run this command now, or in CI.
            </span>
            <a onClick={this._openCiGuide} className='pull-right'>
              <i className='fa fa-question-circle'></i>{' '}
              Need help?
            </a>
          </h5>
          <pre>
            <code>cypress run --record --key {this.state.recordKey || '<record-key>'}</code>
          </pre>
          <hr />
          <p className='alert alert-default'>
            <i className='fa fa-info-circle'></i>{' '}
            Recorded runs will show up{' '}
            <a href='#' onClick={this._openRunGuide}>here</a>{' '}
            and on your{' '}
            <a href='#' onClick={this._openRuns}>Cypress Dashboard</a>.
          </p>
        </div>
      </div>
    )
  }

  _openRunGuide = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/recording-project-runs')
  }

  _openRuns = (e) => {
    e.preventDefault()
    ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${this.props.project.id}/runs`)
  }

  _openCiGuide = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/guides/continuous-integration')
  }

  _openProjectIdGuide = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/what-is-a-project-id')
  }

  _openRun = (runId) => {
    ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${this.props.project.id}/runs/${runId}`)
  }
}

export default RunsList
