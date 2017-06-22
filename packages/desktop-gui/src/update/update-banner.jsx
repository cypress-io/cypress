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
      this.checkId = setInterval(this._checkForUpdate, (5 * 60 * 1000))
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
      <div id='updates-available'>
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
            <h4>Update to the latest version</h4>
            <p>
              Version <strong>{appStore.newVersion}</strong> is now available (currently running <strong>{appStore.displayVersion}</strong>).{' '}
              <a href='#' onClick={this._openChangelog}>Changelog</a>
            </p>
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
            <a href='#' onClick={this._openDownload}>Download the new version</a>
          </li>
          <li>Quit this app</li>
          <li>Extract the download and replace the existing app</li>
        </ol>
      )
    } else {
      return (
        <ol>
          <li>Quit this app</li>
          <li>Run <code>npm install -D cypress@{appStore.newVersion}</code></li>
          <li>Run <code>cypress open</code> to open the new version of the app</li>
        </ol>
      )
    }
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
    ipc.externalOpen(`https://download.cypress.io/desktop${this._os()}`)
  }

  _os () {
    switch (appStore.os) {
      case 'darwin': return '?os=mac'
      case 'linux':  return '?os=linux64'
      case 'win32':  return '?os=win'
      default:       return ''
    }
  }
}

export default UpdateBanner
