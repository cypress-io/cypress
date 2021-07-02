import { SupportedBundlerWebpack } from '../statics/bundler'
import { SupportedFrameworkNext } from '../statics/frameworks'
import PackagesList from './PackagesList.vue'

describe('<PackagesList />', () => {
  it('playground', () => {
    cy.mount(() => <PackagesList />).then(() => {
      Cypress.store.setComponentSetup({
        bundler: SupportedBundlerWebpack,
        framework: SupportedFrameworkNext,
        complete: true,
      })
    })
  })
})
