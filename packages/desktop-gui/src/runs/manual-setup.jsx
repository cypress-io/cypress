import React, { useState } from 'react'
import Markdown from 'markdown-it'
import { FileOpener } from '../lib/file-opener'
import appStore from '../lib/app-store'
import projectsApi from '../projects/projects-api'

const md = new Markdown({
  html: true,
  linkify: true,
})

function ManualSetup ({ error, configFile, project }) {
  const relativeFile = configFile
  const absoluteFile = `${ appStore.projectRoot }/${ relativeFile }`
  const [isSubmitting, setSubmitting] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  const retry = (e) => {
    e.preventDefault()

    setSubmitting(true)

    projectsApi.reopenProject(project).then((config) => {
      setSubmitting(false)
      if (typeof config.projectId !== 'string') {
        // display a message stating that there was no projectId found
        setNewMessage('Cypress was not able to resolve a projectId in the config file')
      }
    })
  }

  return (
    <form onSubmit={retry} className="manual-project-setup">
      <div className='title-wrapper'>
        <h4>Cypress can't update your local <code>projectId</code></h4>
      </div>
      <p>
        <span dangerouslySetInnerHTML={{ __html: md.render(error.message) }} />
      </p>
      <p>
        Error: {error.details}
      </p>
      <p>You can open the config file in your editor by clicking the link below</p>
      <FileOpener
        fileDetails={{
          absoluteFile,
          relativeFile,
          originalFile: absoluteFile,
        }}
      >
        { absoluteFile }
      </FileOpener>
      <p>
        When you have added the projectId to your config, click the "Retry" button
      </p>
      <button
        disabled={isSubmitting}
        className='btn btn-primary btn-block'
      >
        { isSubmitting && <span><i className='fas fa-spin fa-sync-alt'/>{' '}</span> }
        <span>Retry</span>
      </button>
      <p> </p>
      {newMessage.length ? <p className="alert alert-danger">{newMessage}</p> : undefined}
    </form>)
}

export { ManualSetup }
