import ipc from '../lib/ipc'
import specsStore from './specs-store'

const getSpecs = (setProjectError) => {
  ipc.getSpecs((err, specs = []) => {
    if (err) {
      return setProjectError(err)
    }

    specsStore.setSpecs(specs)
  })
}

export {
  getSpecs,
}
