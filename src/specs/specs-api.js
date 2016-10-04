import App from '../lib/app'
import specsCollection from '../specs/specs-collection'

const getSpecs = (setProjectError) => {
  App.ipc('get:specs', (err, specs = []) => {
    if (err) {
      return setProjectError(err)
    }

    specsCollection.setSpecs(specs)

  })
}

export {
  getSpecs,
}
