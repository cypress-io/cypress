import ipc from '../lib/ipc'
import orgUsageStore from './organization-usage-store'

let pollId

const getOrgUsage = (id) => {
  orgUsageStore.setOrgId(id)

  ipc.getUsage(id)
  .then((usage) => {
    orgUsageStore.setOrgUsage(usage)
    return null
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch((error) => {
    orgUsageStore.setError(error)
    return null
  })
  return null
}

const isPolling = () => {
  return !!pollId
}

const pollOrgUsage = (id) => {
  if (pollId) return

  pollId = setInterval(() => {
    getOrgUsage(id)
  }, 10000)
}

const stopPollingOrgUsage = () => {
  clearInterval(pollId)
  pollId = null
}

export default {
  getOrgUsage,
  isPolling,
  pollOrgUsage,
  stopPollingOrgUsage,
}
