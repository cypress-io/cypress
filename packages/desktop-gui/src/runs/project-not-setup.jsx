import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import { configFileFormatted } from '../lib/config-file-formatted'
import SetupProject from './setup-project-modal'
import DashboardBanner from './dashboard-banner'
import authStore from '../auth/auth-store'
import { IconFailurePoint, IconSupercharge, IconFailAlerts } from './svg-icons'

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
      <>
        <div className='empty'>
          { this.props.isValid ? this._getStartedWithCI() : this._invalidProject() }
        </div>
        <BootstrapModal
          show={this.state.setupProjectModalOpen}
          onHide={this._hideSetupProjectModal}
          backdrop='static'
        >
          {this._projectSetup()}
        </BootstrapModal>
      </>
    )
  }

  _getStartedWithCI () {
    return (
      <div className='empty-no-runs'>
        <div>
          <DashboardBanner/>
          <h4>Connect to the Dashboard to see your recorded test runs here!</h4>
          <h5>Sign up and get started for free.</h5>
          <button
            className='btn btn-primary btn-wide'
            onClick={this._showSetupProjectModal}
          >
            Connect to Dashboard
          </button>
        </div>
        <div className='what-is-dashboard'>
          <h5>What is Cypress Dashboard?</h5>
          <div className='columns'>
            <div className='column'>
              <IconFailurePoint />
              <span>See exact point of failure of tests running in CI.</span>
            </div>
            <div className='column'>
              <IconSupercharge />
              <span>Supercharge test times with parallelization.</span>
            </div>
            <div className='column'>
              <IconFailAlerts />
              <span>Get instant test failure alerts via Slack or GitHub.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  _invalidProject () {
    return (
      <div className='empty-runs-not-displayed'>
        <h4>
          <i className='fas fa-exclamation-triangle errored' />{' '}
          Runs cannot be displayed
        </h4>
        <p>We were unable to find an existing project matching the <code>projectId</code> in your {configFileFormatted(this.props.project.configFile)}.</p>
        <p>To see runs for a current project, add the correct <code>projectId</code> to your {configFileFormatted(this.props.project.configFile)}.</p>
        <p>- or -</p>
        <button
          className='btn btn-warning'
          onClick={this._showSetupProjectModal}
        >
          <i className='fas fa-wrench' />{' '}
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

    if (!this.props.isAuthenticated) {
      authStore.openLogin((isAuthenticated) => {
        if (!isAuthenticated) {
          // auth was canceled, cancel project setup too
          this.setState({ setupProjectModalOpen: false })
        }
      })

      return null
    }

    if (this.props.isShowingLogin) {
      // login dialog still open, wait for it to close before proceeding
      return null
    }

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
