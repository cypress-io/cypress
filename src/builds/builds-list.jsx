import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import state from '../lib/state'
import buildsCollection from './builds-collection'
import { getBuilds } from './builds-api'

import Build from './builds-list-item'
import LoginMessage from './login-message'
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
    if (!state.hasUser) return <LoginMessage />

    // TODO: if (noProjectId && !state.hasUser) return <LoginThenSetupInCi/>
    // TODO: if (noProjectId && state.hasUser) return <LoginThenSeeBuilds/>

    if (buildsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    if (buildsCollection.error && (buildsCollection.error.statusCode === 401)) return <PermissionMessage />

    if (!buildsCollection.builds.length) return this._empty()

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

  _empty () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            Run your first build in CI
          </h4>
          <p>Porta Amet Euismod Dolor <strong><i className='fa fa-plus'></i> Euismod</strong> Tellus Vehicula Vestibulum Venenatis Euismod.</p>
          <p>Adipiscing Nibh Magna Ridiculus Inceptos.</p>
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

  _hideSetupProjectModal () {
    this.setState({ setupProjectModalOpen: false })
  }

  _showSetupProjectModal = (e) => {
    e.preventDefault()
    this.setState({ setupProjectModalOpen: true })
  }

  _setupProject = (e) => {
    e.preventDefault()

    // debugger
  }
}

export default Builds
