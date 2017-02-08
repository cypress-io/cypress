import { action } from 'mobx'

import App from '../lib/app'

let pollId

const getRuns = (runsCollection) => {
  runsCollection.loading(true)

  App.ipc('get:builds')
  .then(action('got:runs', (runs) => {
    runsCollection.setRuns(runs)
    return null
  }))
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
