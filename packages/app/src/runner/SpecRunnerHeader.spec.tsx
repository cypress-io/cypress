import SpecRunnerHeader from './SpecRunnerHeader.vue'
import { useAutStore, useSpecStore } from '../store'
import { SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'
import { createEventManager, createTestAutIframe } from '../../cypress/e2e/support/ctSupport'

const getProps = (eventManager = createEventManager(), autIframe = createTestAutIframe()) => ({ eventManager, getAutIframe: () => autIframe })

describe('SpecRunnerHeader', () => {
  it('renders', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:4000')
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })
  })

  it('disabled selector playground and studio buttons when isRunning is true', () => {
    const autStore = useAutStore()

    autStore.setIsRunning(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })

    // TODO: Studio. Out of scope for GA.
    // cy.get('[data-cy="header-studio"]').should('be.disabled')
    cy.get('[data-cy="header-selector"]').should('be.disabled')
  })

  it('disabled selector playground and studio buttons when isLoading is true', () => {
    const autStore = useAutStore()

    autStore.setIsLoading(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })

    // TODO: Studio. Out of scope for GA.
    // cy.get('[data-cy="header-studio"]').should('be.disabled')
    cy.get('[data-cy="header-selector"]').should('be.disabled')
  })

  it('enables selector playground and studio buttons by default', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })

    // TODO: Studio. Out of scope for GA.
    // cy.get('[data-cy="header-studio"]').should('be.disabled')
    cy.get('[data-cy="header-selector"]').should('not.be.disabled')
  })

  it('shows url section if currentTestingType is e2e', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:3000')

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })

    cy.get('[data-cy="aut-url"]').should('exist')
  })

  it('does not show url section if currentTestingType is component', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:3000')

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'component'
      },
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })

    cy.get('[data-cy="aut-url"]').should('not.exist')
  })

  it('shows current browser and possible browsers', () => {
    const specStore = useSpecStore()

    specStore.setActiveSpec({
      relative: 'packages/app/src/runner/SpecRunnerHeader.spec.tsx',
      absolute: '/Users/zachjw/work/cypress/packages/app/src/runner/SpecRunnerHeader.spec.tsx',
      name: 'SpecRunnerHeader.spec.tsx',
    })

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (ctx) => {
        ctx.currentBrowser = ctx.browsers?.find((x) => x.displayName === 'Chrome') ?? null
      },
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} {...getProps()}/>
      },
    })

    cy.get('[data-cy="select-browser"]').click()
    cy.findByRole('listbox').within(() =>
      ['Chrome', 'Electron', 'Firefox'].forEach((browser) => cy.findAllByText(browser)))
  })
})
