import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import SetupProject from "./setup-project-modal"
import { getOrgs } from '../organizations/organizations-api'

@observer
export default class ProjectNotSetup extends Component {
  static propTypes = {
    project: React.PropTypes.object,
  }

  constructor (props) {
    super(props)

    this.state = {
      setupProjectModalOpen: false,
    }
  }

  componentWillMount () {
    getOrgs()
  }

  render () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            Getting Started with CI
          </h4>
          <p>Run Cypress tests on any <a href='#'>Continuous Integration provider</a>.</p>
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

  _hideSetupProjectModal () {
    this.setState({ setupProjectModalOpen: false })
  }

  _showSetupProjectModal = (e) => {
    e.preventDefault()
    this.setState({ setupProjectModalOpen: true })
  }

  _setupProject = (projectDetails) => {
    App.ipc('setup:ci:project', projectDetails).then((newProjectDetails) => {
      this._hideSetupProjectModal()
      this.props.onSetup(newProjectDetails)
    })
  }
}
