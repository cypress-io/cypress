import _ from 'lodash'
import React, { Component } from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import authStore from '../lib/auth-store'
import RunsCollection from './runs-collection'
import errors from '../lib/errors'
import { getRuns, pollRuns, stopPollingRuns } from './runs-api'
import projectsApi from '../projects/projects-api'
import projectsStore from '../projects/projects-store'
import Project from '../project/project-model'
import orgsStore from '../organizations/organizations-store'
import Run from './runs-list-item'
import ErrorMessage from './error-message'
import PermissionMessage from './permission-message'
import ProjectNotSetup from './project-not-setup'

@observer
class Runs extends Component {
  constructor (props) {
    super(props)

    this.runsCollection = new RunsCollection()

    this.state = {
      recordKey: null,
    }
  }

  componentWillMount () {
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
    getRuns(this.runsCollection)
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
    pollRuns(this.runsCollection)
  }

  _stopPolling () {
    stopPollingRuns()
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
      !this.runsCollection.isLoading &&
      !this.runsCollection.error &&
      !this.runsCollection.runs.length &&
      this.props.project.id
    )
  }

  render () {
    const { project } = this.props

    // If the project is invalid
    if (project.state === Project.INVALID) {
      return this._emptyWithoutSetup(false)
    }

    // OR if user does not have acces to the project
    if (project.state === Project.UNAUTHORIZED) {
      return this._permissionMessage()
    }

    // OR if there is an error getting the runs
    if (this.runsCollection.error) {
      // project id missing, probably removed manually from cypress.json
      if (errors.isMissingProjectId(this.runsCollection.error)) {
        return this._emptyWithoutSetup()

      // the project is invalid
      } else if (errors.isNotFound(this.runsCollection.error)) {
        return this._emptyWithoutSetup(false)

      // they are not authorized to see runs
      } else if (errors.isUnauthenticated(this.runsCollection.error) || errors.isUnauthorized(this.runsCollection.error)) {
        return this._permissionMessage()

      // other error, but only show if we don't already have runs
      } else if (!this.runsCollection.isLoaded) {
        return <ErrorMessage error={this.runsCollection.error} />
      }
    }

    // OR the runs are loading for the first time
    if (this.runsCollection.isLoading && !this.runsCollection.isLoaded) return <Loader color='#888' scale={0.5}/>

    // OR there are no runs to show
    if (!this.runsCollection.runs.length) {

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
      <div id='runs-list-page' className='runs'>
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
              disabled={this.runsCollection.isLoading}
              onClick={this._getRuns}
            >
              <i className={`fa fa-refresh ${this.runsCollection.isLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </header>
        <ul className='runs-container list-as-table'>
          {_.map(this.runsCollection.runs, (run) => (
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
    if (!this.runsCollection.lastUpdated) return null

    return (
      <span className='last-updated'>
        Last updated: {this.runsCollection.lastUpdated}
      </span>
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

  @action _setProjectDetails = (projectDetails) => {
    this.runsCollection.setError(null)
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
      <div id='runs-list-page'>
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
            <span>{`{`}</span>
            <span>{`  "projectId": "${this.props.project.id || '<projectId>'}"`}</span>
            <span>{`}`}</span>
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

export default Runs
