import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'
import _ from 'lodash'

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
    if (this.props.project.isLoading) {
      return (
        <div className='loader-wrap'>
          <Loader color='#888' scale={0.5}/>
        </div>
      )
    }

    if (this.props.project.error) return <ErrorMessage onTryAgain={this._reopenProject} project={this.props.project}/>

    return (
      <>
        <ProjectNav project={this.props.project}/>
        <div className='project-content'>
          {this._renderWarnings()}
          {this._currentView()}
        </div>
        <OnBoarding project={this.props.project}/>
      </>
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

  _renderWarnings = () => {
    const { warnings } = this.props.project

    return _.map(warnings, (warning, i) => (
      <WarningMessage
        key={i}
        warning={warning}
        onRetry={() => this._retryPingingBaseUrl(warning)}
        onDismissWarning={() => this._removeWarning(warning)}
      />
    ))
  }

  _removeWarning = (warning) => {
    this.props.project.dismissWarning(warning)
  }

  _reopenProject = () => {
    projectsApi.reopenProject(this.props.project)
  }

  _retryPingingBaseUrl = (warning) => {
    const { project } = this.props

    warning.setRetrying(true)

    projectsApi.pingBaseUrl(project.getConfigValue('baseUrl'))
    .then(() => {
      project.dismissWarning(warning)
    })
    .catch((err) => {
      if (err && err.type === warning.type) return

      project.setError(err)
    })
    .finally(() => {
      warning.setRetrying(false)
    })
  }
}

export default Project
