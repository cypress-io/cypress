import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { Redirect, Route, Link, Switch } from 'react-router-dom'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import projectsStore from '../projects/projects-store'
import { closeProject, openProject } from '../projects/projects-api'

import Config from '../config/config'
import OnBoarding from './onboarding'
import ProjectNav from '../project-nav/project-nav'
import Runs from '../runs/runs-list'
import SpecsList from '../specs/specs-list'

const NoBrowsers = ({ projectPath }) => {
  function closeProject () {
    closeProject(projectPath)
  }

  // TODO: message, back button needs to be different if global

  return (
    <div className='full-alert alert alert-danger error'>
      <p>
        <i className='fa fa-warning'></i>{' '}
        <strong>Can't Launch Any Browsers</strong>
      </p>
      <p>
        We couldn't find any Chrome browsers to launch. To fix, please download Chrome.
      </p>
      <Link
        to='/projects'
        onClick={closeProject}
        className='btn btn-default btn-sm'
      >
        <i className='fa fa-chevron-left'></i>{' '}
        Go Back to Projects
      </Link>
      <a onClick={downloadBrowser} className='btn btn-primary btn-sm'>
        <i className='fa fa-chrome'></i>{' '}
        Download Chrome
      </a>
    </div>
  )
}

const downloadBrowser = function (e) {
  e.preventDefault()
  ipc.externalOpen('https://www.google.com/chrome/browser/desktop')
}

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
  componentWillMount () {
    const path = decodeURIComponent(this.props.match.params.projectPath)
    this.project = projectsStore.getProjectByPath(path)

    this.project.loading(true)

    document.title = this._projectName()
    openProject(this.project)
  }

  componentWillUnmount () {
    document.title = 'Cypress'
  }

  render () {
    if (this.project.isLoading) return <Loader color='#888' scale={0.5}/>

    if (this.project.error !== undefined) return this._error()

    if (!this.project.browsers.length) return <NoBrowsers projectPath={this.project.path}/>

    const basePath = this.props.match.url

    return (
      <div>
        <ProjectNav project={this.project}/>
        <Switch>
          <Route path={`${basePath}/specs`} render={() => <SpecsList project={this.project} />} />
          <Route path={`${basePath}/runs`} render={() => <Runs project={this.project} />} />
          <Route path={`${basePath}/config`} render={() => <Config project={this.project} />} />
          <Redirect from={basePath} to={`${basePath}/specs`} />
        </Switch>
        <OnBoarding project={this.project}/>
      </div>
    )
  }

  _projectName () {
    let project = this.project

    if (project.name) {
      return project.name
    } else {
      let splitName = _.last(project.path.split('/'))
      return _.truncate(splitName, { length: 60 })
    }
  }

  _error = () => {
    let err = this.project.error

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
    closeProject(this.projectId)
  }
}

export default Project
