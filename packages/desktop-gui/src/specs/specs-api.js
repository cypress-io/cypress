import ipc from '../lib/ipc'
import specsStore from './specs-store'

const getSpecs = (setProjectError) => {
  const DEFAULT_SPECS = {
    integration: [],
  }

  ipc.getSpecs((err, specs = DEFAULT_SPECS) => {
    if (err) {
      return setProjectError(err)
    }

    specsStore.setSpecs(specs)
  })
}

export {
  getSpecs,
}
