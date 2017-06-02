import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import C from '../lib/constants'
import projectsApi from '../projects/projects-api'
import viewStore from '../lib/view-store'

import Config from '../config/config'
import OnBoarding from './onboarding'
import ProjectNav from '../project-nav/project-nav'
import Runs from '../runs/runs-list'
import SpecsList from '../specs/specs-list'

const PortInUse = () => {
  return (
    <div>
      <hr />
      <p>To fix, stop the other running process or change the port in cypress.json</p>
    </div>
  )
}

@observer
class Project extends Component {
  componentDidMount () {
    this.props.project.loading(true)

    document.title = this._projectName()

    projectsApi.openProject(this.props.project)
  }

  componentWillUnmount () {
    document.title = 'Cypress'
  }

  render () {
    if (this.props.project.isLoading) return <Loader color='#888' scale={0.5}/>

    if (this.props.project.error !== undefined) return this._error()

    return (
      <div>
        <ProjectNav project={this.props.project}/>
        {this._currentView()}
        <OnBoarding project={this.props.project}/>
      </div>
    )
  }

  _currentView () {
    switch (viewStore.currentView.name) {
      case C.PROJECT_RUNS:
        return <Runs project={this.props.project} />
      case C.PROJECT_CONFIG:
        return <Config project={this.props.project} />
      default:
        return <SpecsList project={this.props.project} />
    }
  }

  _projectName () {
    let project = this.props.project

    if (project.name) {
      return project.name
    } else {
      let splitName = _.last(project.path.split('/'))
      return _.truncate(splitName, { length: 60 })
    }
  }

  _error = () => {
    let err = this.props.project.error

    return (
      <div className='full-alert alert alert-danger error'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>Can't start server</strong>
        </p>
        <p>
          { this._errorMessage(err.message) }
        </p>
        {err.portInUse && <PortInUse />}
        <Link
          to='/projects'
          onClick={this._closeProject}
          className='btn btn-default btn-sm'
        >
          <i className='fa fa-chevron-left'></i>{' '}
          Go Back to Projects
        </Link>
      </div>
    )
  }

  _errorMessage (message) {
    const html = {
      __html: message.split('\n').join('<br />'),
    }

    return (
      <span dangerouslySetInnerHTML={html} />
    )
  }

  _closeProject = function () {
    projectsApi.closeProject(this.props.project)
  }
}

export default Project
