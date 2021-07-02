import EnvironmentSetup from './2-EnvironmentSetup.vue'

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
    cy.contains('Webpack').should('exist')
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
  })

  it('should not allow to change bundler if set by framework', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup detectedFramework="nuxt" />
      </div>
    ))

    cy.contains('Webpack').click({ force: true })
    cy.contains('ViteJs').should('not.exist')
  })
})
