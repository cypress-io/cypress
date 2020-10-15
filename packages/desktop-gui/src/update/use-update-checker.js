import human from 'human-interval'

import appStore from '../lib/app-store'
import ipc from '../lib/ipc'
import { useLifecycle } from '../lib/use-lifecycle'

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
  let checkId

  useLifecycle({
    onMount () {
      if (!appStore.isDev) {
        checkId = setInterval(checkForUpdate, human('60 minutes'))
        checkForUpdate()
      }
    },

    onUnmount () {
      if (!appStore.isDev) {
        ipc.offUpdaterCheck()
        if (checkId) clearInterval(checkId)
      }
    },
  })
}
