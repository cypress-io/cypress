import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

import { configFileFormatted } from '../lib/config-file-formatted'
import SetupProject from './setup-project'
import DashboardBanner from './dashboard-banner'
import authStore from '../auth/auth-store'
import { IconFailurePoint, IconSupercharge, IconFailAlerts } from './svg-icons'

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
          this.state.setupProjectOpen && authStore.isAuthenticated ?
            <div>{this._projectSetup()}</div>
            :
            this.props.isValid ?
              <div>{this._getStartedWithCI()}</div>
              :
              <div>{this._invalidProject()}</div>
        }
      </div>
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
            onClick={this._showSetupProject}
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
