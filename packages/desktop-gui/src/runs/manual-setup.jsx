import React from 'react'
import Tooltip from '@cypress/react-tooltip'
import { FileOpener } from '../lib/file-opener'
import appStore from '../lib/app-store'
import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import MarkdownRenderer from '../lib/markdown-renderer'

function ManualSetup ({ error, configFile, project }) {
  const relativeFile = configFile
  const absoluteFile = `${ appStore.projectRoot }/${ relativeFile }`

  const codeToToAddKeys = `projectId: ${JSON.stringify(error.payload.projectId)},`
  const helpCodeAfter = `module.exports = {
  ${codeToToAddKeys} // <- add this line
  ...config
}`

  const retry = (e) => {
    e.preventDefault()

    projectsApi.reopenProject(project)
  }

  return (
    <form onSubmit={retry} className="manual-project-setup">
      <div className='full-alert-container'>
        <div className='full-alert alert alert-danger error'>
          <p className='header'>
            <i className='fas fa-exclamation-triangle'></i>{' '}
            <strong>Failed to configure your project for Cypress Cloud</strong>
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
            Try Again
          </button>
        </div>
      </div>
      <h4>Add the projectId manually</h4>
      <ol>
        <li>Copy the projectId
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
          Open your config file<br/>
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
        <li>
          Add the projectId to the root of the config object
          <pre>
            {helpCodeAfter}
          </pre>
        </li>
        <li>
          Save and wait a second or two.<br/> This screen should refresh and the error disapear.<br/>If it does not refresh, click "Try Again".
        </li>
      </ol>
    </form>)
}

export { ManualSetup }
