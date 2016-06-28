import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { withRouter } from 'react-router'

import projectsStore from '../projects/projects-store'

import ProjectNav from '../project/project-nav'

import { openProject } from '../projects/projects-api'

const NoBrowsers = () => (
  <div className='full-alert alert alert-danger error'>
    <p>
      <i className='fa fa-warning'></i>{' '}
      <strong>Can't Launch Any Browsers</strong>
    </p>
    <p>
      We couldn't find any Chrome browsers to launch. To fix, please download Chrome.
    </p>
    <a className='btn btn-primary btn-sm'>
      <i className='fa fa-chrome'></i>{' '}
      Download Chrome
    </a>
  </div>
)

const PortInUse = () => (
  <div>
    <hr />
    <p>To fix, stop the other running process or change the port in cypress.json</p>
  </div>
)

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

  render () {
    if (this.project.isLoading) return null

    if (!(this.project.error === undefined)) return this._error()

    if (!this.project.browsers.length) return <NoBrowsers />

    return (
      <div>
        <ProjectNav project={this.project}/>
        { React.cloneElement(this.props.children, { project: this.project }) }
      </div>
    )
  }

  _error = () => {
    let err = this.project.error
    let portInUse

    if (err.portInUse) {
      portInUse = <PortInUse />
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
