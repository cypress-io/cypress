import { observer } from 'mobx-react'
import React from 'react'
import ipc from '../lib/ipc'

const openProjectIdHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/what-is-a-project-id')
}

const ProjectId = observer(({ project }) => {
  if (!project.id) return null

  return (
    <div>
      <a href='#' className='learn-more' onClick={openProjectIdHelp}>
        <i className='fa fa-info-circle'></i>{' '}
        Learn more
      </a>
      <p className='text-muted'>This projectId should be in your <code>cypress.json</code> and checked into source control.
        It identifies your project and should not be changed.
      </p>
      <pre className='line-nums'>
        <span>{'{'}</span>
        <span>{`  "projectId": "${project.id}"`}</span>
        <span>{'}'}</span>
      </pre>
    </div>
  )
})

export default ProjectId
