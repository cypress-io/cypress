import React, { useState } from 'react'
import Markdown from 'markdown-it'
import Tooltip from '@cypress/react-tooltip'
import { FileOpener } from '../lib/file-opener'
import appStore from '../lib/app-store'
import ipc from '../lib/ipc'
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

  const codeToToAddKeys = `  projectId: ${JSON.stringify(error.payload.projectId)}`

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
      <ol>
        <li>Copy the projectId below in your clipboard
          <pre id="code-projecId-config" className="copy-to-clipboard">
            <a className="action-copy" onClick={() => ipc.setClipboardText(codeToToAddKeys)}>
              <Tooltip
                title='Copy to clipboard'
                placement='top'
                className='cy-tooltip'
              >
                <i className='fas fa-clipboard' />
              </Tooltip>
            </a>
            <code>{codeToToAddKeys}</code>
          </pre>
        </li>

        <li>
          Open the config file in your editor<br/>
          <FileOpener
            fileDetails={{
              absoluteFile,
              relativeFile,
              originalFile: absoluteFile,
            }}
          >
            { absoluteFile }
          </FileOpener>
        </li>

        <li>Add the given <code>projectId</code> to the root of your config object</li>
        <li>When you have added the <code>projectId</code>, this page should refresh. <br/>If not, click "Retry"</li>
      </ol>
      <p>
        <button
          disabled={isSubmitting}
          className='btn btn-primary btn-block'
        >
          { isSubmitting && <span><i className='fas fa-spin fa-sync-alt'/>{' '}</span> }
          <span>Retry</span>
        </button>
      </p>
      {newMessage.length ? <p className="alert alert-danger">{newMessage}</p> : undefined}
    </form>)
}

export { ManualSetup }
