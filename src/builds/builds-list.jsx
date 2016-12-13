import _ from 'lodash'
import React, { Component } from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import App from '../lib/app'
import state from '../lib/state'
import buildsCollection from './builds-collection'
import { getBuilds } from './builds-api'
import { getCiKeys } from '../projects/projects-api'
import projectsStore from '../projects/projects-store'
import orgsStore from '../organizations/organizations-store'

import Build from './builds-list-item'
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
    getBuilds()
    this._getCiKey()
  }

  componentDidUpdate () {
    this._getCiKey()
  }

  _getCiKey () {
    if (
      state.hasUser &&
      !buildsCollection.isLoading &&
      !buildsCollection.error &&
      !buildsCollection.builds.length &&
      this.props.project.id
    ) {
      getCiKeys().then((ciKeys = []) => {
        if (ciKeys.length) {
          this.setState({ ciKey: ciKeys[0].id })
        }
      })
    }
  }

  render () {
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

    // OR the build is still loading
    if (buildsCollection.isLoading) return <Loader color='#888' scale={0.5}/>

    // OR they are not authorized to see builds
    if (buildsCollection.error && (buildsCollection.error.statusCode === 401)) return <PermissionMessage />

    // OR there are no builds to show
    if (!buildsCollection.builds.length) {

      // AND they've never setup CI
      if (!this.props.project.id) {
        return this._emptyWithoutSetup()

      // OR they have setup CI
      } else {
        return this._empty()
      }
    }
    //--------End Build States----------//

    // everything's good, there are builds to show!
    return (
      <ul className='builds-list list-as-table'>
        {_.map(buildsCollection.builds, (build) => (
          <Build
            key={build.id}
            goToBuild={() => {}}
            {...build}
          />
        ))}
      </ul>
    )
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

  _openCiGuide = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'http://on.cypress.io/guides/continuous-integration')
  }
}

export default Builds
