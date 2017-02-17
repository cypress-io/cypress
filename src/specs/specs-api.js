import ipc from '../lib/ipc'
import specsCollection from './specs-collection'

const getSpecs = (setProjectError) => {
  ipc.getSpecs((err, specs = []) => {
    if (err) {
      return setProjectError(err)
    }

    specsCollection.setSpecs(specs)
  })
}

export {
  getSpecs,
}
