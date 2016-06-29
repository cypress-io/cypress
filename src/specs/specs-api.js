import App from '../lib/app'
import specsStore from '../specs/specs-store'

const getSpecs = () => {
  specsStore.loading(true)
  App.ipc('get:specs').then((specs) => {
    specsStore.setSpecs(specs)
  })
}

export {
  getSpecs,
}
