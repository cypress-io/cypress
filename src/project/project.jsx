import React, { Component } from 'react'
import { observer } from 'mobx-react'
import _ from 'lodash'
import { withRouter } from 'react-router'

import projectsStore from '../projects/projects-store'

import ProjectNav from '../project/project-nav'

import { openProject } from '../projects/projects-api'

const NoBrowsers = () => (
  <div className='alert alert-danger error'>
    <p>
      <i className='fa fa-warning'></i>
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

@withRouter
@observer
class Project extends Component {
  componentWillMount () {
    this.project = _.find(projectsStore.projects, { id: this.props.params.id })
    if (!this.project) {
      return this.props.router.push('/projects')
    }
    openProject(this.project)
  }

  render () {
    if (!this.project.browsers.length) return <NoBrowsers />

    return (
      <div>
        <ProjectNav project={this.project}/>
        { this.props.children }
      </div>
    )
  }
}

export default Project
