import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import C from '../lib/constants'
import projectsApi from '../projects/projects-api'
import appStore from '../lib/app-store'
import viewStore from '../lib/view-store'

import Config from '../config/config'
import OnBoarding from './onboarding'
import ProjectNav from '../project-nav/project-nav'
import Runs from '../runs/runs-list'
import SpecsList from '../specs/specs-list'

@observer
class Project extends Component {
  componentDidMount () {
    const { project } = this.props

    project.setLoading(true)

    document.title = appStore.isGlobalMode ? project.path : project.displayName

    projectsApi.openProject(project)
  }

  componentWillUnmount () {
    document.title = 'Cypress'

    projectsApi.closeProject(this.props.project)
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

  _error = () => {
    let err = this.props.project.error

    return (
      <div className='full-alert alert alert-danger error'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>Can't start server</strong>
        </p>
        <p>
          <span dangerouslySetInnerHTML={{
            __html: err.message.split('\n').join('<br />'),
          }} />
        </p>
        {err.portInUse && (
          <div>
            <hr />
            <p>To fix, stop the other running process or change the port in cypress.json</p>
          </div>
        )}
        <button
          className='btn btn-default btn-sm'
          onClick={this._reopenProject}
        >
          <i className='fa fa-refresh'></i>{' '}
          Try Again
        </button>
      </div>
    )
  }

  _reopenProject = () => {
    projectsApi.reopenProject(this.props.project)
  }
}

export default Project
