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

import ErrorMessage from './error-message'
import LoginForm from '../auth/login-form'
import Run from './runs-list-item'
import PermissionMessage from './permission-message'
import ProjectNotSetup from './project-not-setup'

@observer
class RunsList extends Component {
  state = {
    recordKey: null,
    isLoading: true,
    hasApiServer: false,
    apiUrl: '',
    apiError: null,
  }

  componentWillMount () {
    this.runsStore = new RunsStore()
  }

  componentDidMount () {
    this._pingApiServer()
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

  _pingApiServer = () => {
    this.setState({ isLoading: true })

    ipc.pingApiServer()
    .then(() => {
      this.setState({
        apiError: null,
        hasApiServer: true,
        isLoading: false,
      })
    })
    .catch(({ apiUrl, message }) => {
      this.setState({
        apiError: message,
        apiUrl,
        isLoading: false,
      })
    })
  }

  _getRuns = () => {
    if (authStore.isAuthenticated && !!this.props.project.id) {
      runsApi.loadRuns(this.runsStore)
    }
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
      !this.runsStore.error &&
      !!this.props.project.id
    )
  }

  _poll () {
    if (runsApi.isPolling()) return

    runsApi.loadRuns(this.runsStore)
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

    // pinging api server to see if we can show anything
    if (this.state.isLoading) {
      return <Loader color='#888' scale={0.5}/>
    }

    // no connection to api server, can't load any runs
    if (!this.state.hasApiServer) {
      return this._noApiServer()
    }

    // no project id means they have not set up to record
    if (!project.id) {
      return this._projectNotSetup()
    }

    // not logged in
    if (!authStore.isAuthenticated) {
      return this._loginMessage()
    }

    // If the project is invalid
    if (project.isInvalid) {
      return this._projectNotSetup(false)
    }

    // OR if user does not have acces to the project
    if (project.isUnauthorized) {
      return this._permissionMessage()
    }

    // OR if there is an error getting the runs
    if (this.runsStore.error) {
      // project id missing, probably removed manually from cypress.json
      if (errors.isMissingProjectId(this.runsStore.error)) {
        return this._projectNotSetup()

      // the project is invalid
      } else if (errors.isNotFound(this.runsStore.error)) {
        return this._projectNotSetup(false)

      // they have been logged out
      } else if (errors.isUnauthenticated(this.runsStore.error)) {
        return this._loginMessage()

      // they are not authorized to see runs
      } else if (errors.isUnauthorized(this.runsStore.error)) {
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
        return this._projectNotSetup()

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
            {this._lastUpdated()}
            <button
              className='btn btn-link btn-sm'
              disabled={this.runsStore.isLoading}
              onClick={this._getRuns}
            >
              <i className={`fa fa-refresh ${this.runsStore.isLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </h5>
          <div>
            <a href="#" className='btn btn-sm see-all-runs' onClick={this._openRuns}>
              See all runs <i className='fa fa-external-link'></i>
            </a>
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

  _noApiServer () {
    return (
      <div className='empty empty-no-api-server'>
        <h4><i className='fa fa-wifi'></i> Cannot connect to API server</h4>
        <p>Viewing runs requires connecting to an external API server.</p>
        <p>We tried but failed to connect to the API server at <em>{this.state.apiUrl}</em></p>
        <p>
          <button
            className='btn btn-default btn-sm'
            onClick={this._pingApiServer}
          >
            <i className='fa fa-refresh'></i>{' '}
            Try again
          </button>
        </p>
        <p>The following error was encountered:</p>
        <pre className='alert alert-danger'><code>{this.state.apiError}</code></pre>
        <a onClick={this._openAPIHelp}>Learn more</a>
      </div>
    )
  }

  _loginMessage () {
    return (
      <div className='empty empty-log-in'>
        <h4>Log in to view runs</h4>
        <p>
          After logging in, you will see recorded runs here and on the <a href='#' onClick={this._visitDashboard}>Cypress Dashboard Service</a>.
        </p>
        <div className='runs-screenshots'>
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-1' />
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-2' />
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-3' />
        </div>

        <LoginForm />
      </div>
    )
  }

  _projectNotSetup (isValid = true) {
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
            <a href='#' onClick={this._openRuns}>Cypress Dashboard Service</a>.
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

  _openRun = (buildNumber) => {
    ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${this.props.project.id}/runs/${buildNumber}`)
  }

  _openAPIHelp () {
    ipc.externalOpen('https://on.cypress.io/help-connect-to-api')
  }
}

export default RunsList
