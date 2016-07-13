import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { withRouter, Link } from 'react-router'

import App from '../lib/app'
import projectsStore from '../projects/projects-store'
import ProjectNav from '../project-nav/project-nav'
import { closeProject, openProject } from '../projects/projects-api'
import OnBoarding from "./onboarding"
import Loader from "react-loader"

const NoBrowsers = () => {

  let _closeProject = function () {
    closeProject(this.projectId)
  }

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
        onClick={_closeProject}
        className='btn btn-default btn-sm'
      >
        <i className="fa fa-chevron-left"></i>{' '}
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
  App.ipc('external:open', 'https://www.google.com/chrome/browser/desktop')
}

const PortInUse = () => {

  let _closeProject = function () {
    closeProject(this.projectId)
  }

  return (
    <div>
      <hr />
      <p>To fix, stop the other running process or change the port in cypress.json</p>
      <Link
        to='/projects'
        onClick={_closeProject}
        className='btn btn-default btn-sm'
      >
        <i className="fa fa-chevron-left"></i>{' '}
        Go Back to Projects
      </Link>
    </div>
  )
}

@withRouter
@observer
class Project extends Component {
  constructor (props) {
    super(props)

    this.project = _.find(projectsStore.projects, { id: props.params.id })

    if (!this.project) {
      return props.router.push('/projects')
    }

    openProject(this.project)
  }

  componentWillUnmount () {
    document.title = 'Cypress'
  }

  render () {
    document.title = `${this.project.name}`

    if (this.project.isLoading) return <Loader color="#888" scale={0.5}/>

    if (!(this.project.error === undefined)) return this._error()

    if (!this.project.browsers.length) return <NoBrowsers projectId={this.project.id}/>

    return (
      <div>
        <ProjectNav project={this.project}/>
        { React.cloneElement(this.props.children, { project: this.project }) }
        <OnBoarding project={this.project}/>
      </div>
    )
  }

  _error = () => {
    let err = this.project.error
    let portInUse

    if (err.portInUse) {
      portInUse = <PortInUse projectId={this.project.id}/>
    }

    return (
      <div className='full-alert alert alert-danger error'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>Can't start server</strong>
        </p>
        <p>
          { err.message.replace('\n', '<br /><br />') }
        </p>
        { portInUse }
      </div>
    )
  }
}

export default Project
