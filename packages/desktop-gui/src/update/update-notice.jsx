import React from 'react'
import { observer } from 'mobx-react'

import appStore from '../lib/app-store'
import Notification from '../notifications/notification'

const UpdateNotice = observer(({ onOpenUpdatesModal }) => {
  const onClose = () => {
    appStore.setDismissedUpdateVersion()
  }

  const onLearnMore = (e) => {
    e.preventDefault()
    appStore.setDismissedUpdateVersion()

    onOpenUpdatesModal()
  }

  return (
    <Notification className='update-notice' show={appStore.nonDismissedUpdateAvailable} onClose={onClose}>
      <i className='fas fa-shipping-fast' />
      An update ({appStore.newVersion}) is available.{' '}
      <a href='#' onClick={onLearnMore}>Learn more</a>
    </Notification>
  )
})

export default UpdateNotice
