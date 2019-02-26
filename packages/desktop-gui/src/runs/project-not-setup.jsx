import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import ipc from '../lib/ipc'
import SetupProject from './setup-project-modal'

@observer
export default class ProjectNotSetup extends Component {
  static propTypes = {
    project: PropTypes.object,
  }

  state = {
    setupProjectModalOpen: false,
  }

  render () {
    return (
      <div>
        <div className="empty">
          {
            this.props.isValid ?
              <div>{this._getStartedWithCI()}</div> :
              <div>{this._invalidProject()}</div>
          }
        </div>
        <BootstrapModal
          show={this.state.setupProjectModalOpen}
          onHide={this._hideSetupProjectModal}
          backdrop='static'
        >
          {this._projectSetup()}
        </BootstrapModal>
      </div>
    )
  }

  _getStartedWithCI () {
    return (
      <div className='empty-no-runs'>
        <h4>You have no recorded runs</h4>
        <p>Cypress can record screenshots, videos and failures when running <code>cypress run</code>.</p>
        <div className='runs-screenshots'>
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-1' />
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-2' />
          <img width='150' height='150' src='https://on.cypress.io/images/desktop-onboarding-thumb-3' />
        </div>
        <p>After runs are recorded, you will see them here and on your <a href='#' onClick={this._visitDashboard}>Cypress Dashboard</a>.</p>
        <button
          className='btn btn-primary'
          onClick={this._showSetupProjectModal}
        >
          <i className='fa fa-wrench'></i>{' '}
          Set up project to record
        </button>
      </div>
    )
  }

  _visitDashboard = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/dashboard')
  }

  _invalidProject () {
    return (
      <div className='empty-runs-not-displayed'>
        <h4>
          <i className='fa fa-warning errored'></i>{' '}
          Runs cannot be displayed
        </h4>
        <p>We were unable to find an existing project matching the <code>projectId</code> in your <code>cypress.json</code>.</p>
        <p>To see runs for a current project, add the correct <code>projectId</code> to your <code>cypress.json</code></p>
        <p>- or -</p>
        <button
          className='btn btn-warning'
          onClick={this._showSetupProjectModal}
        >
          <i className='fa fa-wrench'></i>{' '}
          Set up a new project
        </button>
        <p>
          <small>The new project will have no previous run data.</small>
        </p>
      </div>
    )
  }

  _projectSetup () {
    if (!this.state.setupProjectModalOpen) return null

    return (
      <SetupProject
        project={this.props.project}
        onSetup={this._setupProject}
      />
    )
  }

  _hideSetupProjectModal = () => {
    this.setState({ setupProjectModalOpen: false })
  }

  _showSetupProjectModal = (e) => {
    e.preventDefault()
    this.setState({ setupProjectModalOpen: true })
  }

  _setupProject = (projectDetails) => {
    this._hideSetupProjectModal()
    this.props.onSetup(projectDetails)
  }
}
