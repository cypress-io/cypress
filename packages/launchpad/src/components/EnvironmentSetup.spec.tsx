import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', () => {
  it('playground', { viewportWidth: 800 }, () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup detectedFramework="nuxt" />
      </div>
    ))

    cy.contains('NuxtJs').click()
  })

  it('should select webpack and nuxt when nuxt is detected', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup detectedFramework="nuxt" />
      </div>
    ))

    cy.contains('NuxtJs').should('exist')
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(Cypress.storeConfig.getState().component?.bundler.id).to.equal(
        'webpack',
      )
    })
  })

  it('should allow to change bundler if not set by framework', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup detectedFramework="nuxt" />
      </div>
    ))

    cy.contains('NuxtJs').click()
    cy.contains('ReactJs').click()
    cy.contains('Webpack').click()
    cy.contains('ViteJs').click()
    cy.contains('ViteJs').should('exist')
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(Cypress.storeConfig.getState().component?.bundler.id).to.equal('vite')
    })
  })

  it('should reset the bundler if set by new framework', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup detectedFramework="vue" />
      </div>
    ))

    cy.contains('a bundler').click()
    cy.contains('ViteJs').click()
    cy.contains('ViteJs').should('exist')
    cy.contains('VueJs').click()
    cy.contains('Nuxt').click()
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(Cypress.storeConfig.getState().component?.bundler.id).to.equal(
        'webpack',
      )
    })
  })
})
