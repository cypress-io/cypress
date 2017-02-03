import App from '../lib/app'
import orgsStore from './organizations-store'

let pollId

const getOrgs = () => {
  App.ipc('get:orgs')
  .then((orgs = []) => {
    orgsStore.setOrgs(orgs)
    return null
  })
  .catch((err) => {
    orgsStore.setError(err)
    return null
  })

  return null
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


export {
  getOrgs,
  pollOrgs,
  stopPollingOrgs,
}
