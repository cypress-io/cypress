import React, { useState } from 'react'
import { FileOpener } from '../lib/file-opener'
import appStore from '../lib/app-store'
import projectsApi from '../projects/projects-api'

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
        setNewMessage('Still no sign of projectId')
      }
    })
  }

  return (
    <form onSubmit={retry}>
      <div className='title-wrapper'>
        <h4>{error.message}</h4>
      </div>
      <p><b>Reason:</b> {error.details}</p>
      <p>Open the config file in your editor by clicking the link below</p>
      <FileOpener
        fileDetails={{
          absoluteFile,
          relativeFile,
          originalFile: absoluteFile,
        }}
      >
        { absoluteFile }
      </FileOpener>
      {newMessage.length ? <p className="alert alert-danger">{newMessage}</p> : undefined}
      <p>When you have added the projectId to your config, click "Retry" below</p>
      <button
        disabled={isSubmitting}
        className='btn btn-primary btn-block'
      >
        { isSubmitting && <span><i className='fas fa-spin fa-sync-alt'/>{' '}</span> }
        <span>Retry</span>
      </button>
    </form>)
}

export { ManualSetup }
