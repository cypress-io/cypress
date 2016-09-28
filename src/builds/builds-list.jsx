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
import SetupProject from "./setup-project-modal"

@observer
class Builds extends Component {
  constructor (props) {
    super(props)

    this.state = {
      setupProjectModalOpen: false,
      requestAccessModalOpen: false,
    }
  }

  componentWillMount () {
    getBuilds()
  }

  render () {

    //--------Build States----------//
    // they are not logged in
    if (!state.hasUser) {

      // they've never setup CI
      if (!this.props.project.projectId) {
        return <LoginThenSetupCI/>

      // they have setup CI
      } else {
        return <LoginThenSeeBuilds/>
      }
    }

    if (buildsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    // they are not authorized to see builds
    if (buildsCollection.error && (buildsCollection.error.statusCode === 401)) return <PermissionMessage />

    // there are no builds to show
    if (!buildsCollection.builds.length) {

      // they've never setup CI
      if (!this.props.project.projectId) {
        return this._emptyWithoutSetup()

      // they have setup CI
      } else {
        return this._empty()
      }
    }
    //--------End Build States----------//

    // everything's good, there are builds to show!
    return (
      <div id='builds'>
        <div className='builds-wrapper'>
          <h5>Builds</h5>
        </div>
        <ul className='builds-list list-as-table'>
          { _.map(buildsCollection.builds, (build) => (
            <li key={build.uuid} className='li'>
              <Build build={build} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  _emptyWithoutSetup () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            Getting Started with CI
          </h4>
          <p>Run Cypress tests on any <a href='#'>Continous Integration provider</a>.</p>
          <p>Then see each build's data, screenshots, and video recording.</p>
          <button
            className='btn btn-primary'
            onClick={this._showSetupProjectModal}
            >
            <i className='fa fa-wrench'></i>{' '}
            Setup Project for CI
          </button>
        </div>
        <SetupProject
          project={this.props.project}
          show={this.state.setupProjectModalOpen}
          onConfirm={this._setupProject}
          onHide={this._hideSetupProjectModal}
        />
      </div>
    )
  }

  _empty () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            No Builds Found
          </h4>
          <p>Porta Amet Euismod Dolor <strong><i className='fa fa-plus'></i> Euismod</strong> Tellus Vehicula Vestibulum Venenatis Euismod.</p>
          <p>Adipiscing Nibh Magna Ridiculus Inceptos.</p>
        </div>
      </div>
    )
  }

  _hideSetupProjectModal () {
    this.setState({ setupProjectModalOpen: false })
  }

  _showSetupProjectModal = (e) => {
    e.preventDefault()
    this.setState({ setupProjectModalOpen: true })
  }

  _setupProject = (e) => {
    e.preventDefault()
  }
}

export default Builds
