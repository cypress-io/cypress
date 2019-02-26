import ipc from '../lib/ipc'

let pollId

const isPolling = () => {
  return !!pollId
}

const loadRuns = (runsStore) => {
  runsStore.setLoading(true)

  ipc.getRuns()
  .then((runs) => {
    runsStore.setRuns(runs)

    return null
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch((err) => {
    runsStore.setError(err)

    return null
  })

  return null
}

const pollRuns = (runsStore) => {
  if (pollId) return

  pollId = setInterval(() => {
    loadRuns(runsStore)
  }, 10000)
}

const stopPollingRuns = () => {
  clearInterval(pollId)
  pollId = null
}

export default {
  isPolling,
  loadRuns,
  pollRuns,
  stopPollingRuns,
}
