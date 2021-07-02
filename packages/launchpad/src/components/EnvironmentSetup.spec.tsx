import { ref } from 'vue'
import { SupportedBundlerWebpack } from '../statics/bundler'
import { SupportedFrameworkNext } from '../statics/frameworks'
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

  it('should not allow to change bundler if set by framework through the state', () => {
    const display = ref(false)

    cy.mount(() => (
      <div class="m-10">
        <button onClick={() => {
          display.value = true
        }}>Show the component</button>
        {display.value ? <EnvironmentSetup /> : undefined}
      </div>
    )).then(() => {
      Cypress.store.setComponentSetup({
        bundler: SupportedBundlerWebpack,
        framework: SupportedFrameworkNext,
        complete: false,
      })

      cy.contains('Show').click()
      cy.contains('Webpack').should('be.disabled')
    })
  })
})
