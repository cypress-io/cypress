import { action } from 'mobx'

import ipc from '../lib/ipc'

let pollId

const getRuns = (runsCollection) => {
  runsCollection.loading(true)

  ipc.getBuilds()
  .then(action('got:runs', (runs) => {
    runsCollection.setRuns(runs)
    return null
  }))
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch((err) => {
    runsCollection.setError(err)
    return null
  })

  return null
}

const pollRuns = (runsCollection) => {
  if (pollId) return

  pollId = setInterval(() => {
    getRuns(runsCollection)
  }, 10000)
}

const stopPollingRuns = () => {
  clearInterval(pollId)
  pollId = null
}

export {
  getRuns,
  pollRuns,
  stopPollingRuns,
}
