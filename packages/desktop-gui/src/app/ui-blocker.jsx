import React from 'react'
import { createPortal } from 'react-dom'
import { observer } from 'mobx-react'

import appStore from '../lib/app-store'

const UiBlocker = observer(() => {
  if (!appStore.isUiBlocked) return null

  return createPortal(
    <div className='ui-blocker' />,
    document.getElementById('ui-blocker')
  )
})

export default UiBlocker
