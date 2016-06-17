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
    <p className='helper-docs-append'>
      <a onClick={openHelp} className='helper-docs-link'>
        <i className='fa fa-question-circle'></i>{' '}
        Need help?
      </a>
    </p>
  </div>
)

const Error = () => (
  <div className='alert alert-danger error'>
    <p className='text-center'>{ projectsStore.error }</p>
  </div>
)

const Project = observer(() => {
  if (projectsStore.error) return <Error />

  if (!projectsStore.projects.length) return <Empty />

  if (!projectsStore.chosen) return null

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
