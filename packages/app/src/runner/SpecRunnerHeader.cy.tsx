import SpecRunnerHeader from './SpecRunnerHeader.vue'
import { useAutStore, useSpecStore } from '../store'
import { SpecRunnerHeaderFragment, SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'

function renderWithGql (gqlVal: SpecRunnerHeaderFragment) {
  const eventManager = createEventManager()
  const autIframe = createTestAutIframe()

  return (<SpecRunnerHeader gql={gqlVal}
    eventManager={eventManager}
    getAutIframe={() => autIframe} />)
}

describe('SpecRunnerHeader', () => {
  it('renders', () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:4000')
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.percySnapshot()
  })

  it('disabled selector playground button when isRunning is true', () => {
    const autStore = useAutStore()

    autStore.setIsRunning(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="header-selector"]').should('be.disabled')

    cy.percySnapshot()
  })

  it('disabled selector playground button when isLoading is true', () => {
    const autStore = useAutStore()

    autStore.setIsLoading(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="header-selector"]').should('be.disabled')
  })

  it('enables selector playground button by default', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

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
        return renderWithGql(gqlVal)
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
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="aut-url"]').should('not.exist')
  })

  it('shows current browser and possible browsers', () => {
    const specStore = useSpecStore()

    specStore.setActiveSpec({
      relative: 'packages/app/src/runner/SpecRunnerHeader.spec.tsx',
      name: 'packages/app/src/runner/SpecRunnerHeader.spec.tsx',
      fileName: 'packages/app/src/runner/SpecRunnerHeader.spec.tsx',
      absolute: '/Users/zachjw/work/cypress/packages/app/src/runner/SpecRunnerHeader.spec.tsx',
      baseName: 'SpecRunnerHeader.spec.tsx',
    })

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (ctx) => {
        ctx.currentBrowser = ctx.browsers?.find((x) => x.displayName === 'Chrome') ?? null
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="select-browser"]').click()
    cy.findByRole('listbox').within(() =>
      ['Chrome', 'Electron', 'Firefox'].forEach((browser) => cy.findAllByText(browser)))
  })
})
