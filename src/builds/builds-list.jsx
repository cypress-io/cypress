import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import Loader from 'react-loader'
import { Link } from 'react-router'

import App from '../lib/app'
import state from '../lib/state'
import buildsCollection from './builds-collection'
import errors from '../lib/errors'
import { getBuilds, pollBuilds, stopPollingBuilds } from './builds-api'
import { getCiKeys } from '../projects/projects-api'
import projectsStore from '../projects/projects-store'
import orgsStore from '../organizations/organizations-store'

import Build from './builds-list-item'
import ErrorMessage from './error-message'
import LoginThenSetupCI from './login-then-setup-ci'
import LoginThenSeeBuilds from './login-then-see-builds'
import PermissionMessage from './permission-message'
import ProjectNotSetup from './project-not-setup'

@observer
class Builds extends Component {
  constructor (props) {
    super(props)

    this.state = {
      ciKey: '<ci-key>',
      setupProjectModalOpen: false,
      requestAccessModalOpen: false,
    }
  }

  componentWillMount () {
    const page = this._getPage(this.props)
    this._getBuilds(page)
    if (page === 1) {
      this._poll()
    }
    this._getCiKey()
  }

  componentDidUpdate (prevProps) {
    this._getCiKey()

    const prevPage = this._getPage(prevProps)
    const currentPage = this._getPage(this.props)

    if (prevPage === currentPage) return

    this._getBuilds(currentPage)

    if (currentPage === 1) {
      this._poll()
    } else {
      this._stopPolling()
    }
  }

  componentWillUnmount () {
    this._stopPolling()
  }

  _getBuilds = (page) => {
    getBuilds({ page })
  }

  _poll () {
    if (this._canPollBuilds()) {
      this.pollId = pollBuilds()
    }
  }

  _canPollBuilds () {
    return state.hasUser && !!this.props.project.id
  }

  _stopPolling () {
    stopPollingBuilds(this.pollId)
  }

  _getPage (props) {
    return Number(_.get(props, 'location.query.page') || 1)
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
      state.hasUser &&
      !buildsCollection.isLoading &&
      !buildsCollection.error &&
      !buildsCollection.builds.length &&
      this.props.project.id
    )
  }

  render () {
    const { project } = this.props
    const page = this._getPage(this.props)

    //--------Build States----------//
    // they are not logged in
    if (!state.hasUser) {

      // AND they've never setup CI
      if (!this.props.project.id) {
        return <LoginThenSetupCI/>

      // OR they have setup CI
      } else {
        return <LoginThenSeeBuilds/>
      }
    }

    // OR if there is an error getting the builds
    if (buildsCollection.error) {
      // project id missing, probably removed manually from cypress.json
      if (errors.isMissingProjectId(buildsCollection.error)) {
        return this._emptyWithoutSetup()

      // they are not authorized to see builds
      } else if (errors.isUnauthenticated(buildsCollection.error)) {
        return <PermissionMessage />

      // other error, but only show if we don't already have builds
      } else if (!buildsCollection.isLoaded) {
        return <ErrorMessage error={buildsCollection.error} />
      }
    }

    // OR the builds are loading for the first time
    if (buildsCollection.isLoading && !buildsCollection.isLoaded) return <Loader color='#888' scale={0.5}/>

    // OR the project is invalid
    if (!project.valid) {
      return this._emptyWithoutSetup()
    }

    // OR there are no builds to show
    if (!buildsCollection.builds.length) {

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
      <div className={`builds page-${this._getPage(this.props)}`}>
        <header>
          <a href="#" onClick={this._openDashboard}>
            Open Dashboard <i className='fa fa-external-link'></i>
          </a>
          <div>
            {this._lastUpdated()}
            <button
              className='btn'
              disabled={buildsCollection.isLoading}
              onClick={this._getBuilds}
            >
              <i className={cs('fa fa-refresh', {
                'fa-spin': buildsCollection.isLoading,
              })}></i>
            </button>
          </div>
        </header>
        <div
          className={cs('builds-list-container', {
            'has-newer': this._hasNewer(),
            'has-older': this._hasOlder(),
          })}
        >
          <ul className='builds-list list-as-table'>
            {_.map(buildsCollection.builds, (build) => (
              <Build
                key={build.id}
                goToBuild={() => {}}
                {...build}
              />
            ))}
          </ul>
          <footer>
            <Link
              className='btn newer-builds'
              to={this._hasNewer() ? `/projects/${project.clientId}/builds?page=${page - 1}` : null}
            >
              <i className='fa fa-long-arrow-left'></i> Newer builds
            </Link>
            <span>{/* ensures older builds button is right justified */}</span>
            <Link
              className='btn older-builds'
              to={this._hasOlder() ? `/projects/${project.clientId}/builds?page=${page + 1}` : null}
            >
              Older builds <i className='fa fa-long-arrow-right'></i>
            </Link>
          </footer>
        </div>
      </div>
    )
  }

  _lastUpdated () {
    if (!buildsCollection.lastUpdated) return null

    return (
      <span className='last-updated'>
        Last updated: {buildsCollection.lastUpdated}
      </span>
    )
  }

  _hasNewer () {
    return this._getPage(this.props) > 1
  }

  _hasOlder () {
    return buildsCollection.builds.length >= 30
  }

  _emptyWithoutSetup () {
    return (
      <ProjectNotSetup
        project={this.props.project}
        onSetup={this._setProjectDetails}
      />
    )
  }

  @action _setProjectDetails = (projectDetails) => {
    projectsStore.updateProject(this.props.project, {
      id: projectDetails.id,
      name: projectDetails.projectName,
      public: projectDetails.public,
      orgName: (orgsStore.getOrgById(projectDetails.orgId) || {}).name,
    })
  }

  _empty () {
    return (
      <div id='builds-list-page'>
        <div className='first-build-instructions'>
          <h4>Run Your First Build in CI</h4>
          <p>You'll need to add 2 lines of code to your CI config. Where this code goes depends on your CI provider.</p>
          <h5>Install the CLI tools:</h5>
          <pre><code>npm install -g cypress-cli</code></pre>
          <h5>Run tests and upload assets:</h5>
          <pre><code>cypress ci {this.state.ciKey}</code></pre>
          <p>Refer to your CI provider's documentation to know when to run these commands.</p>
          <p className='center'>
            <a href='#' onClick={this._openCiGuide}>
              <i className='fa fa-question-circle'></i>{' '}
              Learn more about Continuous Integration
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
      <p>A message about how user can invite other users through admin</p>
    )
  }

  _openDashboard = (e) => {
    e.preventDefault()
    App.ipc('external:open', `https://on.cypress.io/admin`)
  }

  _openCiGuide = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'http://on.cypress.io/guides/continuous-integration')
  }
}

export default Builds
