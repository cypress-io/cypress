import ipc from '../lib/ipc'
import orgsStore from './organizations-store'

let pollId

const getOrgs = (firstLoad = false) => {
  if (firstLoad) {
    orgsStore.setLoading(true)
  }

  ipc.getOrgs()
  .then((orgs = []) => {
    orgsStore.setOrgs(orgs)

    return null
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch((err) => {
    orgsStore.setError(err)

    return null
  })
  .finally(() => {
    orgsStore.setLoading(false)
  })

  return null
}

const isPolling = () => {
  return !!pollId
}

const pollOrgs = () => {
  if (pollId) return

  pollId = setInterval(() => {
    getOrgs()
  }, 10000)
}

const stopPollingOrgs = () => {
  clearInterval(pollId)
  pollId = null
}

export default {
  getOrgs,
  isPolling,
  pollOrgs,
  stopPollingOrgs,
}
