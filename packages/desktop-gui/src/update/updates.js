import human from 'human-interval'

import appStore from '../lib/app-store'
import updateStore from '../update/update-store'
import ipc from '../lib/ipc'
import { useLifecycle } from '../lib/use-lifecycle'

const checkForUpdate = () => {
  ipc.offUpdaterCheck()

  ipc.updaterCheck()
  .then((version) => {
    if (version) updateStore.setNewVersion(version)
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

export const getReleaseNotes = (version) => {
  updateStore.setState(updateStore.LOADING_RELEASE_NOTES)

  ipc.getReleaseNotes(version)
  .then((releaseNotes) => {
    if (!releaseNotes || !releaseNotes.title || !releaseNotes.content) {
      updateStore.setReleaseNotes(undefined)
      updateStore.setState(updateStore.SHOW_INSTRUCTIONS)

      return
    }

    updateStore.setReleaseNotes(releaseNotes)
    updateStore.setState(updateStore.SHOW_RELEASE_NOTES)
  })
  .catch(() => {
    updateStore.setReleaseNotes(undefined)
    updateStore.setState(updateStore.SHOW_INSTRUCTIONS)
  })
}
