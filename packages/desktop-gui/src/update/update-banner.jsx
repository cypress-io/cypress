import human from 'human-interval'
import React, { Component } from 'react'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import appStore from '../lib/app-store'
import ipc from '../lib/ipc'

@observer
class UpdateBanner extends Component {
  @observable showingModal = false

  componentDidMount () {
    if (!appStore.isDev) {
      this.checkId = setInterval(this._checkForUpdate, human('60 minutes'))
      this._checkForUpdate()
    }
  }

  componentWillUnmount () {
    document.getElementsByTagName('html')[0].classList.remove('has-updates')

    if (!appStore.isDev) {
      ipc.offUpdaterCheck()
      clearInterval(this.checkId)
    }
  }

  render () {
    if (!appStore.updateAvailable) return null

    document.getElementsByTagName('html')[0].classList.add('has-updates')

    return (
      <div className='updates-available'>
        New updates are available
        <strong onClick={() => this._toggleModal(true)}>
          <i className='fa fa-download'></i>{' '}
          Update
        </strong>
        <BootstrapModal
          show={this.showingModal}
          onHide={() => this._toggleModal(false)}
          backdrop='static'
        >
          <div className='update-modal modal-body os-dialog'>
            <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
            <h4><i className='fa fa-download'></i> Update Available</h4>
            <p>
              <a href='#' onClick={this._openChangelog}><strong>Version {appStore.newVersion}</strong></a> is now available (currently running <strong>Version {appStore.displayVersion}</strong>)
            </p>
            <hr />
            <p><strong>To update Cypress:</strong></p>
            {this._instructions()}
          </div>
        </BootstrapModal>
      </div>
    )
  }

  _instructions () {
    if (appStore.isGlobalMode) {
      return (
        <ol>
          <li>
            <span>
              <a href='#' onClick={this._openDownload}><i className='fa fa-download'></i> Download the new version.</a>
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
          <span>If using yarn, run <code>yarn add cypress@{appStore.newVersion}</code></span>

        </li>
        <li>
          <span>Run <a href='#' onClick={this._openCyOpenDoc}><code>node_modules/.bin/cypress open</code></a> to open the new version.</span>
        </li>
      </ol>
    )
  }

  _checkForUpdate () {
    ipc.offUpdaterCheck()
    ipc.updaterCheck()
    .then((version) => {
      if (version) appStore.setNewVersion(version)
    })
    .catch((error) => {
      console.warn('Error checking for updates:', error) // eslint-disable-line no-console
    })
  }

  @action _toggleModal = (showModal) => {
    this.showingModal = showModal
  }

  _openChangelog (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/changelog')
  }

  _openDownload = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://download.cypress.io/desktop')
  }

  _openCyOpenDoc = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/how-to-open-cypress')
  }
}

export default UpdateBanner
