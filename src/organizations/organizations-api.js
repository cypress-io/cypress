import App from '../lib/app'
import orgsStore from './organizations-store'

const getOrgs = () => {
  return App.ipc('get:orgs')
  .then((orgs = []) => {
    orgsStore.setOrgs(orgs)
  })
  .catch((err) => {
    orgsStore.setError(err)
  })
}

export {
  getOrgs,
}
