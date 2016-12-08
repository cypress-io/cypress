import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import state from '../lib/state'
import buildsCollection from './builds-collection'
import { getBuilds } from './builds-api'

import Build from './builds-list-item'
import LoginThenSetupCI from './login-then-setup-ci'
import LoginThenSeeBuilds from './login-then-see-builds'
import PermissionMessage from './permission-message'
import ProjectNotSetup from "./project-not-setup"

@observer
class Builds extends Component {
  constructor (props) {
    super(props)

    this.state = {
      ciKey: null,
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
      this.props.project.projectId
    ) {
      getCiKey().then((ciKey) => {
        this.setState({ ciKey })
      })
    }
  }

  render () {
    //--------Build States----------//
    // they are not logged in
    if (!state.hasUser) {

      // AND they've never setup CI
      if (!this.props.project.projectId) {
        return <LoginThenSetupCI/>

      // OR they have setup CI
      } else {
        return <LoginThenSeeBuilds/>
      }
    }

    // OR the build is still loading
    if (buildsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    // OR they are not authorized to see builds
    if (buildsCollection.error && (buildsCollection.error.statusCode === 401)) return <PermissionMessage />

    // OR there are no builds to show
    if (!buildsCollection.builds.length) {

      // AND they've never setup CI
      if (!this.props.project.projectId) {
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
        onSetup={this._setProjectId}
      />
    )
  }

  _setProjectId = (projectId) => {
    this.props.project.setProjectId(projectId)
  }

  _empty () {
    return (
      <div id='builds-list-page'>
        <div className='empty'>
          <h4>Getting Started with Builds</h4>
          <p>Lorem ipsum dolor sit amet</p>
          <p>
            Run this command: <code>cypress ci {this.state.ciKey}</code>
          </p>
          <p>Adipiscing Nibh Magna Ridiculus Inceptos.</p>
          <p><a href='#' onClick={this._openCiGuide}>Learn more about Continous Integration</a></p>
          <p>Porta Amet Euismod Dolor <strong><i className='fa fa-plus'></i> Euismod</strong> Tellus Vehicula Vestibulum Venenatis Euismod.</p>
        </div>
      </div>
    )
  }

  _openCiGuide = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'http://on.cypress.io/guides/continuous-integration')
  }
}

export default Builds
