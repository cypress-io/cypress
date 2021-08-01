import { gql } from '@urql/core'
import { ref } from 'vue'
import { ConfigFileFragment, TestConfigFileDocument } from '../generated/graphql-test'
import { ClientTestContext } from '../graphql/graphqlFake'
import ConfigFile from './ConfigFile.vue'

describe('<ConfigFile />', () => {
  let gqlVal: ConfigFileFragment
  let testContext: ClientTestContext

  gql`
    query TestConfigFile {
      wizard {
        ...ConfigFile
      }
    }
  `

  beforeEach(() => {
    testContext = new ClientTestContext()
    testContext.wizard.setFramework('nuxtjs')
    cy.graphql(TestConfigFileDocument, { testContext }).then((result) => {
      if (result.wizard) {
        gqlVal = result.wizard
      }
    })
  })

  beforeEach(() => {
    const display = ref(false)

    cy.mount(() => (
      <div class="m-10">
        <button
          data-cy="show"
          onClick={() => {
            display.value = true
          }}
          class="hidden"
        ></button>
        {display.value ? <ConfigFile gql={gqlVal} /> : undefined}
      </div>
    ), {
      setupContext (ctx) {
        ctx.wizard.setBundler('webpack')
        ctx.wizard.setFramework('nextjs')
      },
    })

    cy.get('[data-cy="show"]').click({ force: true })
  })

  it('playground', { viewportWidth: 1280, viewportHeight: 1024 }, () => {
    cy.contains('button', 'JavaScript').click()
  })

  it('should display a copy button when in manual mode', () => {
    cy.contains('Copy').should('not.exist')
    cy.contains('Create file manually').click()
    cy.contains('Copy').should('exist')
  })
})
