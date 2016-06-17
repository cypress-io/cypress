import React from 'react'
import { observer } from 'mobx-react'
import App from '../lib/app'

import projectsStore from '../projects/projects-store'

import ProjectNav from '../project/project-nav'
import FilesList from '../files/files-list'

const Empty = () => (
  <div className='empty'>
    <h4>Add your first project</h4>
    <p>To begin testing, click <i className='fa fa-plus'></i> above to choose a folder that has the resources of your project.</p>
    <p>Often this is the root folder of a source controlled project.</p>
    <Error />
    <p className='helper-docs-append'>
      <a onClick={openHelp} className='helper-docs-link'>
        <i className='fa fa-question-circle'></i>{' '}
        Need help?
      </a>
    </p>
  </div>
)

const Error = observer(() => {
  if (!projectsStore.error) return null

  return (
    <div className='alert alert-danger error'>
      <p className='text-center'>
        <i className='fa fa-exclamation-triangle'></i>{' '}
        { projectsStore.error }
      </p>
    </div>
  )
})

const NoChosenProject = () => (
  <div className='well-message'>
    <h4>Choose a Project</h4>
    <p>Choose an existing project to test.</p>
    <Error />
    <p className='helper-docs-append'>
      <a onClick={openHelp} className='helper-docs-link'>
        <i className='fa fa-question-circle'></i>{' '}
        Need help?
      </a>
    </p>
  </div>
)

const Project = observer(() => {
  if (!projectsStore.projects.length) return <Empty />

  if (!projectsStore.chosen) return <NoChosenProject />

  return (
    <div>
      <ProjectNav/>
      <FilesList />
    </div>
  )
})

const openHelp = () => (
  App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running/#section-adding-projects')
)

export default Project
