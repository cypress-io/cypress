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
          {
            this.props.isValid ?
              <div>{this._getStartedWithCI()}</div> :
              <div>{this._invalidProject()}</div>
          }
        </div>
        <SetupProject
          project={this.props.project}
          show={this.state.setupProjectModalOpen}
          onSetup={this._setupProject}
          onHide={this._hideSetupProjectModal}
        />
      </div>
    )
  }

  _getStartedWithCI () {
    return (
      <div className='empty-no-builds'>
        <h4>You Have No Recorded Builds</h4>
        <p>Cypress can record screenshots, videos and failures when running <code>cypress ci</code>.</p>
        <div className='builds-screenshots'>
          <img width='150' height='150' src="http://placehold.it/150x150" />
          <img width='150' height='150' src="http://placehold.it/150x150" />
          <img width='150' height='150' src="http://placehold.it/150x150" />
        </div>

        <p>After builds are recorded, you will see them here and on your <a href='#' onClick={this._visitDashboard}>Cypress Dashboard</a></p>
        <button
          className='btn btn-primary'
          onClick={this._showSetupProjectModal}
          >
          <i className='fa fa-wrench'></i>{' '}
          Setup Project to Record
        </button>
      </div>
    )
  }

  _visitDashboard = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/dashboard')
  }

  _invalidProject () {
    return (
      <div>
        <h4>
          <i className='fa fa-warning errored'></i>{' '}
          Builds Cannot Be Displayed
        </h4>
        <p>We were unable to find an existing project matching the <code>projectId</code> in your <code>cypress.json</code>.</p>
        <p>To see builds for a current project, add the correct <code>projectId</code> to your <code>cypress.json</code></p>
        <p>- or -</p>
        <button
          className='btn btn-warning'
          onClick={this._showSetupProjectModal}
          >
          <i className='fa fa-wrench'></i>{' '}
          Setup a New Project
        </button>
        <p>
          <small>The new project will have no previous build data.</small>
        </p>
      </div>
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
