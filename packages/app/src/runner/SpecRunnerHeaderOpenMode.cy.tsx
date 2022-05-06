import SpecRunnerHeaderOpenMode from './SpecRunnerHeaderOpenMode.vue'
import { useAutStore } from '../store'
import { SpecRunnerHeaderFragment, SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'

function renderWithGql (gqlVal: SpecRunnerHeaderFragment) {
  const eventManager = createEventManager()
  const autIframe = createTestAutIframe()

  return (<SpecRunnerHeaderOpenMode
    gql={gqlVal}
    eventManager={eventManager}
    getAutIframe={() => autIframe}/>)
}

describe('SpecRunnerHeaderOpenMode', { viewportHeight: 500 }, () => {
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

    cy.get('[data-cy="playground-activator"]').should('be.disabled')

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

    cy.get('[data-cy="playground-activator"]').should('be.disabled')
    cy.percySnapshot()
  })

  it('enables selector playground button by default', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="playground-activator"]').should('not.be.disabled')
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

  it('url section handles long url/small viewport', {
    viewportWidth: 500,
  }, () => {
    const autStore = useAutStore()

    autStore.updateUrl('http://localhost:3000/pretty/long/url.spec.jsx')

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="aut-url"]').should('exist')
    cy.percySnapshot()
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

    cy.get('[data-cy="playground-activator"]').should('be.visible')
    cy.get('[data-cy="aut-url"]').should('not.exist')
  })

  it('shows current browser and possible browsers', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (ctx) => {
        ctx.activeBrowser = ctx.browsers?.find((x) => x.displayName === 'Chrome') ?? null
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="select-browser"] > button').should('be.enabled').click()
    cy.findByRole('list').within(() =>
      ['Chrome', 'Electron', 'Firefox'].forEach((browser) => cy.findAllByText(browser)))

    cy.get('[data-cy="select-browser"] button[aria-controls]').focus().type('{enter}')
    cy.contains('Firefox').should('be.hidden')
  })

  it('shows current viewport info', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="viewport"]').click()
    cy.contains('The viewport determines').should('be.visible')
    cy.get('[data-cy="viewport"]').click()
    cy.contains('The viewport determines').should('be.hidden')
    cy.get('[data-cy="viewport"] button').focus().type(' ')
    cy.contains('The viewport determines').should('be.visible')
    cy.get('[data-cy="viewport"] button').focus().type('{enter}')
    cy.contains('The viewport determines').should('be.hidden')
  })

  it('disables browser dropdown button when isRunning is true', () => {
    const autStore = useAutStore()

    autStore.setIsRunning(true)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (ctx) => {
        ctx.activeBrowser = ctx.browsers?.find((x) => x.displayName === 'Chrome') ?? null
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="select-browser"] > button').should('be.disabled')

    cy.percySnapshot()
  })
})
