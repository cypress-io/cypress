import React, { Component } from 'react'
import { observer } from 'mobx-react'

import C from '../lib/constants'
import projectsApi from '../projects/projects-api'
import appStore from '../lib/app-store'
import viewStore from '../lib/view-store'

import Loader from '../lib/loader'
import Settings from '../settings/settings'
import OnBoarding from './onboarding'
import ProjectNav from '../project-nav/project-nav'
import RunsList from '../runs/runs-list'
import SpecsList from '../specs/specs-list'

@observer
class Project extends Component {
  componentDidMount () {
    const { project } = this.props

    document.title = appStore.isGlobalMode ? project.displayName : project.path

    projectsApi.openProject(project)
  }

  componentWillUnmount () {
    document.title = 'Cypress'
  }

  render () {
    const { project } = this.props

    if (project.isLoading) return <Loader fullscreen>Opening project...</Loader>

    if (project.isClosing) return <Loader fullscreen>Closing project...</Loader>

    if (project.error) return this._error()

    return (
      <div>
        <ProjectNav project={project}/>
        <div className='project-content'>
          {this._warning()}
          {this._currentView()}
        </div>
        <OnBoarding project={project}/>
      </div>
    )
  }

  _currentView () {
    switch (viewStore.currentView.name) {
      case C.PROJECT_RUNS:
        return <RunsList project={this.props.project} />
      case C.PROJECT_SETTINGS:
        return <Settings project={this.props.project} />
      default:
        return <SpecsList project={this.props.project} />
    }
  }

  _warning () {
    const { warning } = this.props.project

    if (!warning) return null

    return (
      <div className='alert alert-warning'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>Warning</strong>
        </p>
        <p dangerouslySetInnerHTML={{
          __html: warning.message.split('\n').join('<br />'),
        }} />
        <button className='btn btn-link close' onClick={this._removeWarning}>
          <i className='fa fa-remove' />
        </button>
      </div>
    )
  }

  _error () {
    let err = this.props.project.error

    return (
      <div className='full-alert alert alert-danger error'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>{err.title || 'Can\'t start server'}</strong>
        </p>
        <p dangerouslySetInnerHTML={{
          __html: err.message.split('\n').join('<br />'),
        }} />
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

  _removeWarning = () => {
    this.props.project.clearWarning()
  }

  _reopenProject = () => {
    projectsApi.reopenProject(this.props.project)
  }
}

export default Project
