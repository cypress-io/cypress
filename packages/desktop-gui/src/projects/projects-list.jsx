import _ from 'lodash'
import ipc from '../lib/ipc'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import projectsApi from './projects-api'
import projectsStore from './projects-store'
import { Link, routes } from '../lib/routing'

const ProjectListItem = observer(({ project, onRemove }) => (
  <li>
    <Link className='project' to={routes.specs(project)}>
      <span className='project-name'>{project.displayName}</span>
      <span className='project-path'>{project.displayPath}</span>
    </Link>
    <button onClick={(e) => {
      e.stopPropagation()
      onRemove()
    }}>
      <i className='fa fa-remove' />
    </button>
  </li>
))

@observer
class ProjectsList extends Component {
  componentDidMount () {
    projectsApi.getProjects()
  }

  render () {
    if (!projectsStore.isLoading && !projectsStore.projects.length) return null

    return (
      <div className='projects-list'>
        <h3>Recent Projects</h3>
        {this._content()}
      </div>
    )
  }

  _content () {
    if (projectsStore.isLoading) return <Loader color='#888' scale={0.5}/>

    return (
      <ul>
        {_.map(projectsStore.projects, (project) => (
          <ProjectListItem
            key={project.path}
            project={project}
            onRemove={this._removeProject(project)}
          />
        ))}
      </ul>
    )
  }

  _removeProject = (project) => () => {
    projectsStore.removeProject(project)
    ipc.removeProject(project.path)
  }
}

export default ProjectsList
