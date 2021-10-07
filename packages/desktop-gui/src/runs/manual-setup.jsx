import React from 'react'
import Tooltip from '@cypress/react-tooltip'
import { FileOpener } from '../lib/file-opener'
import appStore from '../lib/app-store'
import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import MarkdownRenderer from '../lib/markdown-renderer'

function ManualSetup ({ error, configFile, project, retryInsert }) {
  const relativeFile = configFile
  const absoluteFile = `${ appStore.projectRoot }/${ relativeFile }`

  const codeToToAddKeys = `projectId: '${error.payload.projectId}',`
  const helpCodeAfter = `module.exports = {
  ${codeToToAddKeys} // <- add this line
  ...config
}`

  const retry = (e) => {
    e.preventDefault()

    projectsApi.reopenProject(project).then((project) => {
      if (!project.id) {
        retryInsert(error.payload.projectId)
      }
    })
  }

  return (
    <form onSubmit={retry} className="manual-project-setup">
      <div className='full-alert-container'>
        <div className='full-alert alert alert-danger error'>
          <p className='header'>
            <i className='fas fa-exclamation-triangle'></i>{' '}
            <strong>Failed to configure your project</strong>
          </p>
          <span className='alert-content'>
            <MarkdownRenderer markdown={error.message}/>
            <pre>
              {error.details}
            </pre>
          </span>
          <button
            className='btn btn-default btn-sm'
            onClick={retry}
          >
            <i className='fas fa-sync-alt'/>{' '}
            Try again
          </button>
        </div>
      </div>
      <h4>Add the projectId manually and try again</h4>
      <ol>
        <li>Copy the projectId:
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
          Open your{' '}
          <FileOpener
            fileDetails={{
              absoluteFile,
              relativeFile,
              originalFile: absoluteFile,
            }}
          >
            { relativeFile }
          </FileOpener>
          {' '}file.
        </li>
        <li>
          Add the projectId to the root of the config object:
          <pre>
            {helpCodeAfter}
          </pre>
        </li>
        <li>
          Save and click the "Try again" button above.
        </li>
      </ol>
    </form>)
}

export { ManualSetup }
