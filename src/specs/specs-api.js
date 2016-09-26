import App from '../lib/app'
// import { action } from 'mobx'
import specsCollection from '../specs/specs-collection'

const getSpecs = (setProjectError) => {
  App.ipc('get:specs', (err, specs = []) => {
    if (err) {
      return setProjectError(err)
    }

    specsCollection.setSpecs(specs)

  })

  // App.ipc('get:specs')
  // .then(action('got:specs', (specs) => {
  //   specsCollection.setSpecs(specs)
  // }))
  // .catch((err) => {
  //   err
  // })
}

export {
  getSpecs,
}
