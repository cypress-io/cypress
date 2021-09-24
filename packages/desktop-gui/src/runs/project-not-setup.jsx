import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

import { configFileFormatted } from '../lib/config-file-formatted'
import SetupProject from './setup-project'
import authStore from '../auth/auth-store'
import LoginForm from '../auth/login-form'
import DashboardBanner from './dashboard-banner'
import WhatIsDashboard from './what-is-dashboard'
import ErrorMessage from './error-message'

function isConfigJSONFile (filePath) {
  return /\.json$/.test(filePath)
}

@observer
export default class ProjectNotSetup extends Component {
  static propTypes = {
    project: PropTypes.object,
  }

  state = {
    setupProjectOpen: false,
  }

  componentDidUpdate () {
    if (this.state.setupProjectOpen && !authStore.isAuthenticated) {
      this._openLogin()
      this.setState({ setupProjectOpen: false })
    }
  }

  render () {
    return (
      <div className="empty">
        {
          !isConfigJSONFile(this.props.project.configFile) ?
            <ErrorMessage>
              Cypress can only configure a project with a json config file
            </ErrorMessage>
            :
            this.state.setupProjectOpen && authStore.isAuthenticated ?
              this._projectSetup()
              :
              this.props.isValid ? authStore.isAuthenticated ?
                this._connectProject()
                :
                this._logIn()
                :
                this._invalidProject()
        }
      </div>
    )
  }

  _connectProject () {
    return (
      <div className='empty-no-runs'>
        <div>
          <DashboardBanner/>
          <h4>Connect to the Dashboard to see your recorded test results here!</h4>
          <button
            className='btn btn-primary btn-wide btn-connect'
            onClick={this._showSetupProject}
          >
            Connect to Dashboard
          </button>
        </div>
        <WhatIsDashboard />
      </div>
    )
  }

  _logIn () {
    return (
      <div className='empty-no-runs'>
        <div>
          <DashboardBanner/>
          <h4>Log in to the Dashboard to see your recorded test results here!</h4>
          <LoginForm utm='Runs Tab without projectId' onSuccess={this._showSetupProject} />
        </div>
        <WhatIsDashboard />
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
          onClick={this._showSetupProject}
        >
          <i className='fas fa-wrench' />{' '}
          Set up a project
        </button>
        <p>
          <small>You can link to an existing project or create a new project.</small>
        </p>
      </div>
    )
  }

  _projectSetup () {
    return (
      <SetupProject
        project={this.props.project}
        onSetup={this._setupProject}
        onClose={this._hideSetupProject}
      />
    )
  }

  _hideSetupProject = () => {
    this.setState({ setupProjectOpen: false })
  }

  _showSetupProject = () => {
    this.setState({ setupProjectOpen: true })
  }

  _setupProject = (projectDetails) => {
    this._hideSetupProject()
    this.props.onSetup(projectDetails)
  }

  _openLogin = () => {
    authStore.openLogin((isAuthenticated) => {
      // if auth was successful, proceed
      // auth was canceled, cancel project setup too
      this.setState({ setupProjectOpen: isAuthenticated })
    })
  }
}
