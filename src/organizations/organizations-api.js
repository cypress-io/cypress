import App from '../lib/app'
import orgsStore from './organizations-store'

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

export {
  getOrgs,
}
