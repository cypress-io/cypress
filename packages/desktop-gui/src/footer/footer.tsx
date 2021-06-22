import cs from 'classnames'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'

import ipc from '../lib/ipc'
import updateStore from '../update/update-store'
import { getReleaseNotes, useUpdateChecker } from '../update/updates'

import UpdateModal from '../update/update-modal'
import UpdateNotice from '../update/update-notice'
import { gql } from '@apollo/client'
import { FooterFragment } from '../generated/graphql'

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

gql`
fragment Footer on Query {
  app {
    cypressVersion
    updateAvailable
    latestCypressVersion
  }
}
`

interface FooterProps {
  data: FooterFragment
}

const Footer: React.FC<FooterProps> = observer(({ data }) => {
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

    if (!data.app.updateAvailable) return

    updateStore.setState(updateStore.SHOW_INSTRUCTIONS)
    state.showModal()
  }

  const showModalWithReleaseNotes = () => {
    getReleaseNotes(updateStore.newVersion)
    state.showModal()
  }

  return (
    <footer className={cs('footer', { 'update-available': updateStore.updateAvailable })}>
      <button className='version' onClick={showModal} disabled={!updateStore.updateAvailable}>
        <i className='update-indicator fas fa-arrow-alt-circle-up' />
        Version {data.app.cypressVersion}
      </button>
      <button className='open-changelog' onClick={openChangelog}>Changelog</button>
      <UpdateModal show={state.showingModal} onClose={state.hideModal} />
      <UpdateNotice onOpenUpdatesModal={showModalWithReleaseNotes} />
    </footer>
  )
})

export default Footer
