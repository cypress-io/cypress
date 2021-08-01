import { gql } from '@urql/core'
import InstallDependencies from './InstallDependencies.vue'
import { TestInstallDependenciesDocument } from '../generated/graphql-test'
import { computed, defineComponent } from '@vue/runtime-core'
import { useQuery } from '@urql/vue'

describe('<InstallDependencies />', () => {
  gql`
  query TestInstallDependencies {
    wizard {
      ...InstallDependencies
    }
  }
  `

  beforeEach(() => {
    cy.mount(defineComponent({
      setup () {
        const result = useQuery({ query: TestInstallDependenciesDocument })

        return {
          gql: computed(() => result.data.value?.wizard),
        }
      },
      render (props) {
        return props.gql ? <InstallDependencies gql={props.gql} /> : <div />
      },
    }), {
      setupContext (ctx) {
        ctx.wizard.setBundler('webpack')
        ctx.wizard.setFramework('react')
      },
    })
  })

  it('playground', () => {
    cy.contains('@cypress/react').should('exist')
    cy.contains('@cypress/webpack-dev-server').should('exist')
  })

  it('should infinitely toggle manual', () => {
    cy.contains('@cypress/react').should('exist')
    cy.contains('manually').click()
    cy.contains('yarn add').should('exist')
    cy.contains('Install manually').click()
    cy.contains('@cypress/react').should('exist')
    cy.contains('manually').click()
    cy.contains('yarn add').should('exist')
    cy.contains('Install manually').click()
    cy.contains('@cypress/react').should('exist')
  })

  it('should allow to toggle to manual', () => {
    cy.contains('manually').click()
  })
})
