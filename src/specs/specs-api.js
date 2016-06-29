import App from '../lib/app'
import specsCollection from '../specs/specs-collection'

const getSpecs = () => {
  specsCollection.loading(true)

  App.ipc('get:specs')
  .then((specs) => {
    specsCollection.setSpecs(specs)
  })
  .catch((err) => {
    err
  })
}

export {
  getSpecs,
}
