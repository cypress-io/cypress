import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import App from '../lib/app'
import state from '../lib/state'
import BuildsCollection from './builds-collection'
import errors from '../lib/errors'
import { getBuilds, pollBuilds, stopPollingBuilds } from './builds-api'
import { getCiKeys } from '../projects/projects-api'
import projectsStore from '../projects/projects-store'
import Project from '../project/project-model'
import orgsStore from '../organizations/organizations-store'

import Build from './builds-list-item'
import ErrorMessage from './error-message'
// import LoginThenSetupCI from './login-then-setup-ci'
// import LoginThenSeeBuilds from './login-then-see-builds'
import PermissionMessage from './permission-message'
import ProjectNotSetup from './project-not-setup'

@observer
class Builds extends Component {
  constructor (props) {
    super(props)

    this.buildsCollection = new BuildsCollection()

    this.state = {
      ciKey: null,
    }
  }

  componentWillMount () {
    this._getBuilds()
    this._handlePolling()
    this._getCiKey()
  }

  componentDidUpdate () {
    this._getCiKey()
    this._handlePolling()
  }

  componentWillUnmount () {
    this._stopPolling()
  }

  _getBuilds = () => {
    getBuilds(this.buildsCollection)
  }

  _handlePolling () {
    if (this._shouldPollBuilds()) {
      this._poll()
    } else {
      this._stopPolling()
    }
  }

  _shouldPollBuilds () {
    return (
      state.hasUser &&
      !!this.props.project.id
    )
  }

  _poll () {
    pollBuilds(this.buildsCollection)
  }

  _stopPolling () {
    stopPollingBuilds()
  }

  _getCiKey () {
    if (this._needsCiKey()) {
      getCiKeys().then((ciKeys = []) => {
        if (ciKeys.length) {
          this.setState({ ciKey: ciKeys[0].id })
        }
      })
    }
  }

  _needsCiKey () {
    return (
      !this.state.ciKey &&
      state.hasUser &&
      !this.buildsCollection.isLoading &&
      !this.buildsCollection.error &&
      !this.buildsCollection.builds.length &&
      this.props.project.id
    )
  }

  render () {
    const { project } = this.props

    // //--------Build States----------//
    // THIS IS NOT CURRENTLY IN USE WHILE
    // LOGIN IS RESTRICTED ON THE APP
    // // they are not logged in
    // if (!state.hasUser) {

    //   // AND they've never setup CI
    //   if (!this.props.project.id) {
    //     return <LoginThenSetupCI/>

    //   // OR they have setup CI
    //   } else {
    //     return <LoginThenSeeBuilds/>
    //   }
    // }

    // If the project is invalid
    if (project.state === Project.INVALID) {
      return this._emptyWithoutSetup(false)
    }

    // OR if user does not have acces to the project
    if (project.state === Project.UNAUTHORIZED) {
      return this._permissionMessage()
    }

    // OR if there is an error getting the builds
    if (this.buildsCollection.error) {
      // project id missing, probably removed manually from cypress.json
      if (errors.isMissingProjectId(this.buildsCollection.error)) {
        return this._emptyWithoutSetup()

      // the project is invalid
      } else if (errors.isNotFound(this.buildsCollection.error)) {
        return this._emptyWithoutSetup(false)

      // they are not authorized to see builds
      } else if (errors.isUnauthenticated(this.buildsCollection.error) || errors.isUnauthorized(this.buildsCollection.error)) {
        return this._permissionMessage()

      // other error, but only show if we don't already have builds
      } else if (!this.buildsCollection.isLoaded) {
        return <ErrorMessage error={this.buildsCollection.error} />
      }
    }

    // OR the builds are loading for the first time
    if (this.buildsCollection.isLoading && !this.buildsCollection.isLoaded) return <Loader color='#888' scale={0.5}/>

    // OR there are no builds to show
    if (!this.buildsCollection.builds.length) {

      // AND they've never setup CI
      if (!project.id) {
        return this._emptyWithoutSetup()

      // OR they have setup CI
      } else {
        return this._empty()
      }
    }
    //--------End Build States----------//

    // everything's good, there are builds to show!
    return (
      <div id='builds-list-page' className='builds'>
        <header>
          <h5>Builds
          <a href="#" className='btn btn-sm see-all-builds' onClick={this._openBuilds}>
            See All <i className='fa fa-external-link'></i>
          </a>

          </h5>
          <div>
            {this._lastUpdated()}
            <button
              className='btn btn-link btn-sm'
              disabled={this.buildsCollection.isLoading}
              onClick={this._getBuilds}
            >
              <i className={cs('fa fa-refresh', {
                'fa-spin': this.buildsCollection.isLoading,
              })}></i>
            </button>
          </div>
        </header>
        <ul className='builds-container list-as-table'>
          {_.map(this.buildsCollection.builds, (build) => (
            <Build
              key={build.id}
              goToBuild={this._openBuild}
              build={build}
            />
          ))}
        </ul>
      </div>
    )
  }

  _lastUpdated () {
    if (!this.buildsCollection.lastUpdated) return null

    return (
      <span className='last-updated'>
        Last updated: {this.buildsCollection.lastUpdated}
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
        onRetry={this._getBuilds}
      />
    )
  }

  @action _setProjectDetails = (projectDetails) => {
    this.buildsCollection.setError(null)
    projectsStore.updateProject(this.props.project, {
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
      <div id='builds-list-page'>
        <div className='first-build-instructions'>
          <h4>Run Your First Build in CI</h4>
          <p className='text-muted'>To record build results, simply run the commands below.</p>
          <h5>Install the <a href='#' onClick={this._openCliNpmPackage}>CLI tools</a>:</h5>
          <pre><code>npm install -g cypress-cli</code></pre>
          <h5>Run tests and upload assets:</h5>
          <pre><code>cypress ci {this.state.ciKey || '<ci-key>'}</code></pre>
          <p className='text-muted'>
            Refer to your CI provider's documentation to know when to run these commands during Continous Integration.{' '}
            <a href='#' onClick={this._openCiGuide}>
              <i className='fa fa-info-circle'></i>{' '}
              Learn more
            </a>
          </p>
          {this._privateMessage()}
        </div>
      </div>
    )
  }

  _privateMessage () {
    if (this.props.project.public) return null

    return (
      <p className='text-muted'>
        <hr />
        To manage your project's CI keys, edit access to builds or transfer a project, go to the{' '}
        <a href='#' onClick={this._openBuilds}>
          <i className='fa fa-external-link'></i>{' '}
          Cypress Dashboard
        </a>.
      </p>
    )
  }

  _openBuilds = (e) => {
    e.preventDefault()
    App.ipc('external:open', `https://on.cypress.io/dashboard/projects/${this.props.project.id}/builds`)
  }

  _openCiGuide = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/guides/continuous-integration')
  }

  _openCliNpmPackage = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://www.npmjs.com/package/cypress-cli')
  }

  _openBuild = (buildId) => {
    App.ipc('external:open', `https://on.cypress.io/dashboard/projects/${this.props.project.id}/builds/${buildId}`)
  }
}

export default Builds
