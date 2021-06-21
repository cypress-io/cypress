import _ from 'lodash'
import React from 'react'
import gql from 'graphql-tag'

import projectsStore from './projects-store'
import { useMutation } from '@apollo/client'
import { SelectProjectDocument, RemoveProjectDocument } from '../generated/graphql'

gql`
  fragment ProjectListItem on Project {
    id
    relativePath
    displayName
    displayPath
  }
`

gql`
  mutation RemoveProject($projectId: ID!) {
    removeProject(id: $projectId) {
      recentProjects {
        ...ProjectListItem
      }
    }
  }
`

gql`
  mutation SelectProject($projectId: ID!) {
    selectProject(id: $projectId) {
      currentProject {
        id
      }
    }
  }
`

const ProjectListItem = ({ project }) => {
  const [selectProject] = useMutation(SelectProjectDocument, { variables: { projectId: project.id } })
  const [removeProject] = useMutation(RemoveProjectDocument, { variables: { projectId: project.id } })

  return (
    <li>
      <a className='project' href='#' onClick={(e) => {
        e.stopPropagation()
        selectProject()
      }}>
        <span className='project-name'>{project.displayName}</span>
        <span className='project-path'>{project.displayPath}</span>
      </a>
      <button onClick={(e) => {
        e.stopPropagation()
        removeProject()
      }}>
        <i className='fas fa-times' />
      </button>
    </li>
  )
}

class ProjectsList extends React.PureComponent {
  render () {
    if (!this.props.recentProjects.length) return null

    return (
      <div className='projects-list'>
        <h1>Recent Projects:</h1>
        {this._error()}
        {this._content()}
      </div>
    )
  }

  _error () {
    if (!projectsStore.error) return null

    return (
      <div className='alert alert-danger'>
        <p>
          <i className='fas fa-exclamation-triangle'></i>{' '}
          <strong>Error</strong>
        </p>
        <p dangerouslySetInnerHTML={{
          __html: projectsStore.error.message.split('\n').join('<br />'),
        }} />
      </div>
    )
  }

  _content () {
    return (
      <ul>
        {_.map(this.props.recentProjects, (project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
      </ul>
    )
  }
}

export default ProjectsList
