import React from 'react'
import { observer } from 'mobx-react'

import projectsStore from '../projects/projects-store'

import ProjectNav from '../project/project-nav'
import FilesList from '../files/files-list'

const Empty = () => (
  <div className="empty">
    Add Project
  </div>
)

const Error = () => (
  <div className="alert alert-danger error">
    <p className='text-center'>{ projectsStore.error }</p>
  </div>
)

const Project = observer(() => {
  if (projectsStore.error) return <Error />

  if (!projectsStore.projects.length) return <Empty />

  return (
    <div>
      <ProjectNav />
      <FilesList />
    </div>
  )
})

export default Project
