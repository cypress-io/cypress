import { SupportedBundlerWebpack } from '../utils/bundler'
import { SupportedFrameworkNext } from '../utils/frameworks'
import ManualInstall from './ManualInstall.vue'

describe('<ManualInstall />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="m-10 border-1 rounded border-gray-400">
        <ManualInstall />
      </div>
    )).then(() => {
      Cypress.storeConfig.setComponentSetup({
        bundler: SupportedBundlerWebpack,
        framework: SupportedFrameworkNext,
      })
    })
  })
})
