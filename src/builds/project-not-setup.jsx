import React, { Component } from 'react'
import { observer } from 'mobx-react'

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
            this.props.project.valid ?
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
      <div>
        <h4>Getting Started with CI</h4>
        <button
          className='btn btn-primary'
          onClick={this._showSetupProjectModal}
          >
          <i className='fa fa-wrench'></i>{' '}
          Setup Project for CI
        </button>
      </div>
    )
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
          Setup a New Project for CI
        </button>
        <p>
          <small>The new project will have no previous build data.</small>
        </p>
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
    this.props.onSetup(projectDetails)
    this._hideSetupProjectModal()
  }
}
