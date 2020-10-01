import { observer } from 'mobx-react'
import React from 'react'
import BootstrapModal from 'react-bootstrap-modal'

import appStore from '../lib/app-store'
import ipc from '../lib/ipc'

const openChangelog = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/changelog?source=dgui_footer')
}

const openDownload = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://download.cypress.io/desktop')
}

const openCyOpenDoc = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/how-to-open-cypress')
}

const Instructions = observer(() => {
  if (appStore.isGlobalMode) {
    return (
      <ol>
        <li>
          <span>
            <a href='#' onClick={openDownload}><i className='fas fa-download'></i> Download the new version.</a>
          </span>
        </li>
        <li>
          <span>Quit this app.</span>
        </li>
        <li>
          <span>Extract the download and replace the existing app.</span>
        </li>
      </ol>
    )
  }

  return (
    <ol>
      <li>
        <span>Quit this app.</span>
      </li>
      <li>
        <span>If using npm, run <code>npm install --save-dev cypress@{appStore.newVersion}</code></span>
        <br/>
        <span>If using yarn, run <code>yarn upgrade cypress@{appStore.newVersion}</code></span>
      </li>
      <li>
        <span>Run <a href='#' onClick={openCyOpenDoc}><code>node_modules/.bin/cypress open</code></a> to open the new version.</span>
      </li>
    </ol>
  )
})

const UpdateModal = observer(({ show, onClose }) => {
  return (
    <BootstrapModal show={show} onHide={onClose} backdrop='static'>
      <div className='update-modal modal-body os-dialog'>
        <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
        <h4><i className='fas fa-download'></i> Update Available</h4>
        <p>
          <a href='#' onClick={openChangelog}><strong>Version {appStore.newVersion}</strong></a> is now available (currently running <strong>Version {appStore.displayVersion}</strong>)
        </p>
        <hr />
        <p><strong>To update Cypress:</strong></p>
        <Instructions />
      </div>
    </BootstrapModal>
  )
})

export default UpdateModal
