import { useEffect } from 'react'
import human from 'human-interval'

import appStore from '../lib/app-store'
import ipc from '../lib/ipc'

const checkForUpdate = () => {
  ipc.offUpdaterCheck()

  ipc.updaterCheck()
  .then((version) => {
    if (version) appStore.setNewVersion(version)
  })
  .catch((error) => {
    console.warn('Error checking for updates:', error) // eslint-disable-line no-console
  })
}

export const useUpdateChecker = () => {
  useEffect(() => {
    let checkId

    if (!appStore.isDev) {
      checkId = setInterval(checkForUpdate, human('60 minutes'))
      checkForUpdate()
    }

    return () => {
      if (!appStore.isDev) {
        ipc.offUpdaterCheck()
        clearInterval(checkId)
      }
    }
  }, [true])
}
