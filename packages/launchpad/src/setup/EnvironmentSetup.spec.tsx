import { EnvironmentSetupFragmentDoc } from '../generated/graphql'
import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', () => {
  it('playground', { viewportWidth: 800 }, () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      type: (ctx) => ctx.wizard.setFramework('nuxtjs'),
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup gql={gqlVal} />
        </div>
      ),
    })

    cy.contains('Nuxt.js').click()
  })

  it('should select webpack and nuxt when nuxt is detected', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      type: (ctx) => ctx.wizard.setFramework('nuxtjs'),
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup gql={gqlVal} />
        </div>
      ),
    }).then((ctx) => {
      cy.contains('Nuxt.js').should('exist')
      cy.contains('Next Step')
      .click()
      .then(() => {
        expect(ctx.wizard.bundler?.id).to.equal(
          'webpack',
        )
      })
    })
  })

  it('should allow to change bundler if not set by framework', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      type: (ctx) => ctx.wizard.setFramework('nuxtjs'),
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup gql={gqlVal} />
        </div>
      ),
    }).then((ctx) => {
      cy.contains('Nuxt.js').click()
      cy.contains('React.js').click()
      cy.contains('Webpack').click()
      cy.contains('Vite').click()
      cy.contains('Vite').should('exist')
      cy.contains('Next Step')
      .click()
      .then(() => {
        expect(ctx.wizard.bundler?.id).to.equal('vite')
      })
    })
  })

  it('should reset the bundler if set by new framework', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      type: (ctx) => ctx.wizard.setFramework('vue'),
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup gql={gqlVal} />
        </div>
      ),
    }).then((ctx) => {
      cy.contains('Pick a bundler').click()
      cy.contains('Vite').click()
      cy.contains('Vite').should('exist')
      cy.contains('Vue.js').click()
      cy.contains('Nuxt').click()
      cy.contains('Next Step')
      .click()
      .then(() => {
        expect(ctx.wizard.bundler?.id).to.equal(
          'webpack',
        )
      })
    })
  })
})
