import _ from 'lodash'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import { configFileFormatted } from '../lib/config-file-formatted'
import SetupProject from './setup-project-modal'
import authStore from '../auth/auth-store'

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
        <div className='empty-no-runs-banner'>
          <div className='left-vector'/>
          <div className='right-vector'/>
          <div className='empty-no-runs-banner-db'>
            {_.map(['pass', 'fail', 'pass'], (test, i) => (
              <div key={`test-${i}`} className={`empty-no-runs-test ${test}`}>
                <div className='empty-no-runs-test-left'>
                  <div className='empty-no-runs-test-title'>
                    <div className='test-title-top'>
                      <i className='fas fa-check' />
                      {_.capitalize(test)}ed test
                    </div>
                    <div className='test-title-bottom'>
                      <div className='fake-text' style={{ width: '45px' }}/>
                      <div className='fake-text' style={{ width: '60px' }}/>
                      <div className='fake-text' style={{ width: '20px' }}/>
                    </div>
                  </div>
                </div>
                <div className='empty-no-runs-test-mid'>
                  <i className='far fa-clock' />
                  <div className='fake-text' style={{ width: '70px' }} />
                </div>
                <div className='empty-no-runs-test-end'>
                  <i className='fas fa-hourglass-end'/>
                  <div className='fake-text' style={{ width: '60px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
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
          className='btn btn-primary setup-project-btn'
          onClick={this._showSetupProjectModal}
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
          <i className='fas fa-exclamation-triangle errored'></i>{' '}
          Runs cannot be displayed
        </h4>
        <p>We were unable to find an existing project matching the <code>projectId</code> in your {configFileFormatted(this.props.project.configFile)}.</p>
        <p>To see runs for a current project, add the correct <code>projectId</code> to your {configFileFormatted(this.props.project.configFile)}.</p>
        <p>- or -</p>
        <button
          className='btn btn-warning'
          onClick={this._showSetupProjectModal}
        >
          <i className='fas fa-wrench'></i>{' '}
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
