import SpecRunnerHeader from './SpecRunnerHeader.vue'
import { useAutStore } from '../store'
import { SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'

describe('SpecRunnerHeader', () => {
  it('renders', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:4000')
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })
  })

  it('disabled selector playground and studio buttons when isRunning is true', () => {
    const autStore = useAutStore()

    autStore.setIsRunning(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })

    cy.get('[data-cy="header-studio"]').should('be.disabled')
    cy.get('[data-cy="header-selector"]').should('be.disabled')
  })

  it('disabled selector playground and studio buttons when isLoading is true', () => {
    const autStore = useAutStore()

    autStore.setIsLoading(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })

    cy.get('[data-cy="header-studio"]').should('be.disabled')
    cy.get('[data-cy="header-selector"]').should('be.disabled')
  })

  it('enables selector playground and studio buttons by default', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })

    cy.get('[data-cy="header-studio"]').should('not.be.disabled')
    cy.get('[data-cy="header-selector"]').should('not.be.disabled')
  })

  it('shows url section if activeTestingType is e2e', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:3000')

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.activeTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })

    cy.get('[data-cy="aut-url"]').should('exist')
  })

  it('does not show url section if activeTestingType is component', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:3000')

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.activeTestingType = 'component'
      },
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })

    cy.get('[data-cy="aut-url"]').should('not.exist')
  })

  it('shows current browser and viewport', () => {
    const autStore = useAutStore()

    autStore.updateDimensions(555, 777)
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (ctx) => {
        ctx.selectedBrowser = ctx.browsers?.find((x) => x.displayName === 'Chrome') ?? null
      },
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      },
    })

    cy.get('[data-cy="select-browser"]').contains('Chrome 555x777')
  })
})
