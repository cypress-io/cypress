import { action } from 'mobx'

import App from '../lib/app'

let pollId

const getBuilds = (buildsCollection) => {
  buildsCollection.loading(true)

  App.ipc('get:builds')
  .then(action('got:builds', (builds) => {
    buildsCollection.setBuilds(builds)
    return null
  }))
  .catch((err) => {
    buildsCollection.setError(err)
    return null
  })

  return null
}

const pollBuilds = (buildsCollection) => {
  if (pollId) return

  pollId = setInterval(() => {
    getBuilds(buildsCollection)
  }, 10000)
}

const stopPollingBuilds = () => {
  clearInterval(pollId)
  pollId = null
}

export {
  getBuilds,
  pollBuilds,
  stopPollingBuilds,
}
