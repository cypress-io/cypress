import { support, files } from '../server/webpack/bundle-specs'
import init from '@cypress/evergreen/dist/main.bundle'

init(files, support)

if (module.hot) {
  module.hot.accept(['../server/webpack/bundle-specs'], (changes) => {
    window.runAllSpecs()
  })
}
