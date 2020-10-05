import cs from 'classnames'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'

import ipc from '../lib/ipc'
import appStore from '../lib/app-store'
import { useUpdateChecker } from '../update/use-update-checker'

import UpdateModal from '../update/update-modal'

const openChangelog = (e) => {
  e.target.blur()

  ipc.externalOpen('https://on.cypress.io/changelog?source=dgui_footer')
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

  useUpdateChecker()

  const showModal = (e) => {
    e.target.blur()

    if (!appStore.updateAvailable) return

    state.showModal()
  }

  return (
    <footer className={cs('footer', { 'update-available': appStore.updateAvailable })}>
      <button className='version' onClick={showModal} disabled={!appStore.updateAvailable}>
        <i className='update-indicator fas fa-arrow-alt-circle-up' />
        Version {appStore.displayVersion}
      </button>
      <button className='open-changelog' onClick={openChangelog}>Changelog</button>
      <UpdateModal show={state.showingModal} onClose={state.hideModal} />
    </footer>
  )
})

export default Footer
