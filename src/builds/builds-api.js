import { action } from 'mobx'

import App from '../lib/app'

const getBuilds = (buildsCollection, options) => {
  buildsCollection.loading(true)

  return App.ipc('get:builds', options)
  .then(action('got:builds', (builds) => {
    buildsCollection.setBuilds(builds)
  }))
  .catch((err) => {
    buildsCollection.setError(err)
  })
}

const pollBuilds = (buildsCollection) => {
  return setInterval(() => {
    getBuilds(buildsCollection)
  }, 10000)
}

const stopPollingBuilds = (pollId) => {
  clearInterval(pollId)
}

export {
  getBuilds,
  pollBuilds,
  stopPollingBuilds,
}
