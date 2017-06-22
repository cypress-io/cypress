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
        <strong onClick={() => this._toggleModal(true)}>
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
          <p>
            Version <strong>{appStore.newVersion}</strong> is now available (currently running <strong>{appStore.version}</strong>).{' '}
            <a href='#' onClick={this._openChangelog}>Changelog</a>
          </p>
          <ol>
            <li>Quit this app</li>
            <li> Run <code>npm install -D cypress@{appStore.newVersion}</code>
            </li>
            <li>Run <code>cypress open</code> to open the new version of the app</li>
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

  @action _toggleModal = (showModal) => {
    this.showingModal = showModal
  }

  _openChangelog (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/changelog')
  }
}

export default UpdateBanner
