import { ClientTestContext } from '@packages/server/lib/graphql/context/ClientTestContext'
import { gql } from '@urql/core'
import { EnvironmentSetupFragment, TestEnvironmentSetupDocument } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', () => {
  let gqlVal: EnvironmentSetupFragment
  let testContext: ClientTestContext

  gql`
    query TestEnvironmentSetup {
      wizard {
        ...EnvironmentSetup
      }
    }
  `

  beforeEach(() => {
    testContext = new ClientTestContext()
    testContext.wizard.setFramework('nuxtjs')
    cy.testQuery(TestEnvironmentSetupDocument, testContext).then((result) => {
      if (result.wizard) {
        gqlVal = result.wizard
      }
    })
  })

  it('playground', { viewportWidth: 800 }, () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup gql={gqlVal} />
      </div>
    ))

    cy.contains('NuxtJs').click()
  })

  it('should select webpack and nuxt when nuxt is detected', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup gql={gqlVal} />
      </div>
    ), {
      setupContext: () => testContext,
    })

    cy.contains('NuxtJs').should('exist')
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(testContext.wizard.bundler?.id).to.equal(
        'webpack',
      )
    })
  })

  it('should allow to change bundler if not set by framework', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup gql={gqlVal} />
      </div>
    ), { setupContext: () => testContext })

    cy.contains('NuxtJs').click()
    cy.contains('ReactJs').click()
    cy.contains('Webpack').click()
    cy.contains('ViteJs').click()
    cy.contains('ViteJs').should('exist')
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(testContext.wizard.bundler?.id).to.equal('vite')
    })
  })

  it('should reset the bundler if set by new framework', () => {
    testContext.wizard.setFramework('vuejs')
    cy.testQuery(TestEnvironmentSetupDocument, testContext).then(({ wizard }) => {
      // For typescript
      if (wizard) {
        cy.mount(() => (
          <div class="m-10">
            <EnvironmentSetup gql={wizard} />
          </div>
        ))
      }
    })

    cy.contains('a bundler').click()
    cy.contains('ViteJs').click()
    cy.contains('ViteJs').should('exist')
    cy.contains('VueJs').click()
    cy.contains('Nuxt').click()
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(testContext.wizard.bundler?.id).to.equal(
        'webpack',
      )
    })
  })
})
