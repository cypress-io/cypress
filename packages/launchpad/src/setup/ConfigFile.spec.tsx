import { ref } from 'vue'
import { ConfigFileFragmentDoc, ProjectRootFragmentDoc } from '../generated/graphql'
import ConfigFile from './ConfigFile.vue'

describe('<ConfigFile />', () => {
  beforeEach(() => {
    const display = ref(false)

    cy.mountFragmentsOnRoot([
      ConfigFileFragmentDoc,
      ProjectRootFragmentDoc,
    ], {
      type: (ctx) => {
        ctx.wizard.setFramework('cra')
        ctx.wizard.setBundler('webpack')

        return ctx
      },
      render: (gqlVal) => {
        return (<div class="m-10">
          <button
            data-cy="show"
            onClick={() => {
              display.value = true
            }}
            class="hidden"
          ></button>
          {
            display.value
              ? <ConfigFile
                wizard={gqlVal.wizard}
                app={gqlVal.app}
              />
              : undefined
          }
        </div>
        )
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
