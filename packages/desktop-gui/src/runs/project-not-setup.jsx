import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

import { configFileFormatted } from '../lib/config-file-formatted'
import SetupProject from './setup-project'
import DashboardBanner from './dashboard-banner'
import authStore from '../auth/auth-store'

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
      <div>
        <div className="empty">
          {
            this.props.isValid ?
              this.state.setupProjectOpen && authStore.isAuthenticated ?
                <div>{this._projectSetup()}</div> :
                <div>{this._getStartedWithCI()}</div> :
              <div>{this._invalidProject()}</div>
          }
        </div>
      </div>
    )
  }

  _getStartedWithCI () {
    return (
      <div className='empty-no-runs'>
        <DashboardBanner/>
        <h4>You could see test recordings here!</h4>
        <div className='empty-no-runs-details'>
          <h5>Connect to Cypress Dashboard for free:</h5>
          <ul>
            <li>Record test runs in CI and debug failed tests with ease</li>
            <li>Understand the health of your tests with test analytics</li>
            <li>Improve testing efficiency with parallelization, load balancing, and more</li>
          </ul>
        </div>
        <button
          className='btn btn-primary btn-wide'
          onClick={this._showSetupProject}
        >
          Connect to Dashboard
        </button>
        <p>After logging in, you'll see recorded test runs here and in your Cypress Dashboard.</p>
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
          Set up a new project
        </button>
        <p>
          <small>The new project will have no previous run data.</small>
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

  _showSetupProject = (e) => {
    e.preventDefault()

    if (!this.props.isAuthenticated) {
      this._openLogin()
    } else {
      this.setState({ setupProjectOpen: true })
    }
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
