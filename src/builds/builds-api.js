import { action } from 'mobx'

import App from '../lib/app'
import buildsCollection from './builds-collection'

const getBuilds = (shouldLoad = true) => {
  if (shouldLoad) {
    buildsCollection.loading(true)
  }

  return App.ipc('get:builds')
  .then(action('got:builds', (builds) => {
    buildsCollection.setBuilds(builds)
  }))
  .catch((err) => {
    buildsCollection.setError(err)
  })
}

const pollBuilds = () => {
  return setInterval(() => {
    getBuilds(false)
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
