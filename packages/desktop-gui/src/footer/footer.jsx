import cs from 'classnames'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'

import UpdateModal from '../update/update-modal'
import ipc from '../lib/ipc'
import appStore from '../lib/app-store'

const openChangelog = () => {
  ipc.externalOpen('https://on.cypress.io/changelog')
}

const Footer = observer(() => {
  const state = useLocalStore(() => ({
    showingModal: false,
    showModal: action(() => {
      state.showingModal = true
    }),
    hideModal: action(() => {
      state.showingModal = false
    }),
  }))

  return (
    <footer className={cs('footer', { 'update-available': appStore.updateAvailable })}>
      <button className='version' onClick={state.showModal} disabled={!appStore.updateAvailable}>
        <i className='update-indicator fas fa-arrow-alt-circle-up' />
        Version {appStore.displayVersion}
      </button>
      <button className='open-changelog' onClick={openChangelog}>Changelog</button>
      <UpdateModal show={state.showingModal} onClose={state.hideModal} />
    </footer>
  )
})

export default Footer
