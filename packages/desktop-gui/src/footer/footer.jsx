import cs from 'classnames'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'

import ipc from '../lib/ipc'
import appStore from '../lib/app-store'
import updateStore from '../update/update-store'
import { getReleaseNotes, useUpdateChecker } from '../update/updates'

import ShortcutsHelpModal from '../update/shortcuts-help-modal'
import UpdateModal from '../update/update-modal'
import UpdateNotice from '../update/update-notice'

const openChangelog = (e) => {
  e.target.blur()

  ipc.externalOpen({
    url: 'https://on.cypress.io/changelog',
    params: {
      source: 'dgui_footer',
      utm_medium: 'Footer',
      utm_campaign: 'Changelog',
    },
  })
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

    showingShorcutModal: false,
    showShortcutModal: action(() => {
      state.showingShorcutModal = true
    }),
    hideShortcutModal: action(() => {
      state.showingShorcutModal = false
    }),

  }))

  useUpdateChecker()

  const showShortcutHelpModal = () => {
    state.showShortcutModal()
  }

  const showModal = (e) => {
    e.target.blur()

    if (!updateStore.updateAvailable) return

    updateStore.setState(updateStore.SHOW_INSTRUCTIONS)
    state.showModal()
  }

  const showModalWithReleaseNotes = () => {
    getReleaseNotes(updateStore.newVersion)
    state.showModal()
  }

  return (
    <footer className={cs('footer', { 'update-available': updateStore.updateAvailable })}>
      <button className='open-shortcuts-help' data-cy='open-shortcuts-help-btn' onClick={showShortcutHelpModal}>
        <i className='update-indicator fas fa-question' />
        Shortcuts
      </button>
      <button className='version' onClick={showModal} disabled={!updateStore.updateAvailable}>
        <i className='update-indicator fas fa-arrow-alt-circle-up' />
        Version {appStore.displayVersion}
      </button>
      <button className='open-changelog' onClick={openChangelog}>Changelog</button>
      <ShortcutsHelpModal show={state.showingShorcutModal} onClose={state.hideShortcutModal} />
      <UpdateModal show={state.showingModal} onClose={state.hideModal} />
      <UpdateNotice onOpenUpdatesModal={showModalWithReleaseNotes} />
    </footer>
  )
})

export default Footer
