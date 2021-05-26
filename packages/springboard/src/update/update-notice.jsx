import React from 'react'
import { observer } from 'mobx-react'

import updateStore from './update-store'

import Notification from '../notifications/notification'

const UpdateNotice = observer(({ onOpenUpdatesModal }) => {
  const onClose = () => {
    updateStore.setDismissedUpdateVersion()
  }

  const onLearnMore = (e) => {
    e.preventDefault()
    updateStore.setDismissedUpdateVersion()

    onOpenUpdatesModal()
  }

  return (
    <Notification className='update-notice' show={updateStore.nonDismissedUpdateAvailable} onClose={onClose}>
      <i className='fas fa-shipping-fast' />
      An update ({updateStore.newVersion}) is available.{' '}
      <a href='#' onClick={onLearnMore}>Learn more</a>
    </Notification>
  )
})

export default UpdateNotice
