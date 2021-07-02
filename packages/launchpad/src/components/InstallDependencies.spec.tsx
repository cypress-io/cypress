import { SupportedBundlerWebpack } from '../statics/bundler'
import { SupportedFrameworkNext } from '../statics/frameworks'
import InstallDependencies from './InstallDependencies.vue'

describe('<InstallDependencies />', () => {
  it('playground', () => {
    cy.mount(() => (
      <InstallDependencies />
    )).then(() => {
      Cypress.store.setComponentSetup({
        bundler: SupportedBundlerWebpack,
        framework: SupportedFrameworkNext,
        complete: true,
      })
    })
  })
})
