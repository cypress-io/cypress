import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import C from '../lib/constants'
import projectsApi from '../projects/projects-api'
import appStore from '../lib/app-store'
import viewStore from '../lib/view-store'
import ipc from '../lib/ipc'

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

    project.setLoading(true)

    document.title = appStore.isGlobalMode ? project.displayName : project.path

    projectsApi.openProject(project)
  }

  componentWillUnmount () {
    document.title = 'Cypress'

    projectsApi.closeProject(this.props.project)
  }

  render () {
    if (this.props.project.isLoading) return <Loader color='#888' scale={0.5}/>

    if (this.props.project.error) return <ErrorMessage error={this.props.project.error} onTryAgain={this._reopenProject}/>

    const { warning } = this.props.project

    return (
      <div>
        <ProjectNav project={this.props.project}/>
        <div className='project-content'>
          {warning &&
            <WarningMessage warning={warning} onClearWarning={this._removeWarning}/>
          }
          {this._currentView()}
        </div>
        <OnBoarding project={this.props.project}/>
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
        return <Settings project={this.props.project} app={this.props.app}/>
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
