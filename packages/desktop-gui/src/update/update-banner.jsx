import human from 'human-interval'
import React, { Component } from 'react'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'

import UpdateModal from './update-modal'
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
          <i className='fas fa-download'></i>{' '}
          Update
        </strong>
        <UpdateModal show={this.showingModal} onClose={() => this._toggleModal(false)} />
      </div>
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
}

export default UpdateBanner
