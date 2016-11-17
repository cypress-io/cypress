import App from '../lib/app'
import orgsStore from './organizations-store'

const getOrgs = (setGetOrgsError) => {
  App.ipc('get:orgs', (err, orgs = []) => {
    if (err) {
      return setGetOrgsError(err)
    }

    orgsStore.setOrgs(orgs)

  })
}

export {
  getOrgs,
}
