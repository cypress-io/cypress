import { ClientTestContext } from '@packages/server/lib/graphql/context/ClientTestContext'
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { computed, defineComponent } from '@vue/runtime-core'
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
    cy.graphql(TestEnvironmentSetupDocument, { testContext }).then((result) => {
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

    cy.contains('Nuxt.js').click()
  })

  it('should select webpack and nuxt when nuxt is detected', () => {
    cy.mount(() => (
      <div class="m-10">
        <EnvironmentSetup gql={gqlVal} />
      </div>
    ), {
      setupContext: () => testContext,
    })

    cy.contains('Nuxt.js').should('exist')
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(testContext.wizard.bundler?.id).to.equal(
        'webpack',
      )
    })
  })

  it('should allow to change bundler if not set by framework', () => {
    let testCtx: ClientTestContext

    cy.mount(defineComponent({
      setup () {
        const result = useQuery({
          query: TestEnvironmentSetupDocument,
        })

        return {
          gql: computed(() => result.data.value?.wizard),
        }
      },
      render (props) {
        return (
          <div class="m-10">
            {props.gql && <EnvironmentSetup gql={props.gql} />}
          </div>
        )
      },
    }), {
      setupContext (ctx) {
        testCtx = ctx
        ctx.wizard.setFramework('nuxtjs')
      },
    })

    cy.contains('Nuxt.js').click()
    cy.contains('React.js').click()
    cy.contains('Webpack').click()
    cy.contains('Vite').click()
    cy.contains('Vite').should('exist')
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(testCtx.wizard.bundler?.id).to.equal('vite')
    })
  })

  it('should reset the bundler if set by new framework', () => {
    // For typescript
    cy.mount(defineComponent({
      setup () {
        const result = useQuery({
          query: TestEnvironmentSetupDocument,
        })

        return {
          gql: computed(() => result.data.value?.wizard),
        }
      },
      render (props) {
        return (
          <div class="m-10">
            {props.gql && <EnvironmentSetup gql={props.gql} />}
          </div>
        )
      },
    }), {
      setupContext (ctx) {
        ctx.wizard.setFramework('vue')
      },
    })

    cy.contains('a bundler').click()
    cy.contains('Vite').click()
    cy.contains('Vite').should('exist')
    cy.contains('Vue.js').click()
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
