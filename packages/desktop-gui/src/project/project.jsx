import React, { Component } from 'react'
import { observer } from 'mobx-react'

import C from '../lib/constants'
import projectsApi from '../projects/projects-api'
import appStore from '../lib/app-store'
import viewStore from '../lib/view-store'
import ipc from '../lib/ipc'

import Loader from '../lib/loader'
import Settings from '../settings/settings'
import OnBoarding from './onboarding'
import ProjectNav from '../project-nav/project-nav'
import RunsList from '../runs/runs-list'
import SpecsList from '../specs/specs-list'
import ErrorMessage from './error-message'
import WarningMessage from './warning-message'

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

    if (project.error) return <ErrorMessage error={this.props.project.error} onTryAgain={this._reopenProject}/>

    const { warning } = project

    return (
      <div>
        <ProjectNav project={project}/>
        <div className='project-content'>
          {warning &&
            <WarningMessage warning={warning} onClearWarning={this._removeWarning}/>
          }
          {this._currentView()}
        </div>
        <OnBoarding project={project}/>
      </div>
    )
  }

  _externalOpen (e) {
    e.preventDefault()

    return ipc.externalOpen(e.target.href)
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

  _removeWarning = () => {
    this.props.project.clearWarning()
  }

  _reopenProject = () => {
    projectsApi.reopenProject(this.props.project)
  }
}

export default Project
