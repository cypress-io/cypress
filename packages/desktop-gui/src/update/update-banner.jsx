import React, { Component } from 'react'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import appStore from '../lib/app-store'
import updater from './update-model'
import ipc from '../lib/ipc'

@observer
class UpdateBanner extends Component {
  @observable showingModal = false

  componentDidMount () {
    this.checkId = setInterval(this._checkForUpdate, (5 * 60 * 1000))
    this._checkForUpdate()
  }

  componentWillUnmount () {
    document.getElementsByTagName('html')[0].classList.remove('has-updates')

    ipc.offUpdaterCheck()
    clearInterval(this.checkId)
  }

  render () {
    if (!appStore.updateAvailable) return null

    document.getElementsByTagName('html')[0].classList.add('has-updates')

    return (
      <div id='updates-available'>
        New updates are available
        <strong onClick={this._downloadUpdate}>
          <i className='fa fa-download'></i>{' '}
          Update
        </strong>
        {this._modal()}
      </div>
    )
  }

  _modal () {
    return (
      <BootstrapModal
        show={this.showingModal}
        onHide={() => this._toggleModal(false)}
        backdrop='static'
      >
        <div className='update-modal modal-body os-dialog'>
          <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
          <h4>Update to the latest version</h4>
          <p>Version <strong>{appStore.newVersion}</strong> is now available (<a href='#' onClick={this._openChangelog}>Changelog</a>)</p>
          <ol>
            <li>
              Set <code>"cypress"</code> in your app's <code>package.json</code> to <code>"{appStore.newVersion}"</code>

              <pre>
                {'{\n'}
                {'  "devDependencies": {\n'}
                {`    "cypress": "${appStore.newVersion}"\n`}
                {'  }\n'}
                {'}'}
              </pre>
            </li>
            <li>Quit this app and run <code>npm install</code></li>
            <li>Run <code>cypress open</code> to re-open the new version of the app</li>
          </ol>
        </div>
      </BootstrapModal>
    )
  }

  _checkForUpdate () {
    ipc.offUpdaterCheck()
    ipc.updaterCheck()
    .then((version) => {
      appStore.setNewVersion(version)
    })
    .catch((error) => {
      console.warn('Error checking for updates:', error) // eslint-disable-line no-console
    })
  }

  _downloadUpdate = () => {
    if (appStore.isGlobalMode) {
      updater.openUpdateWindow()
    } else {
      this._toggleModal(true)
    }
  }

  @action _toggleModal = (showModal) => {
    this.showingModal = showModal
  }

  _openChangelog (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/changelog')
  }
}

export default UpdateBanner
