import App from '../lib/app'
import { action } from 'mobx'
import specsCollection from '../specs/specs-collection'

const getSpecs = () => {
  specsCollection.loading(true)

  App.ipc('get:specs')
  .then(action('got:specs', (specs) => {
    specsCollection.setSpecs(specs)
  }))
  .catch((err) => {
    err
  })
}

export {
  getSpecs,
}
