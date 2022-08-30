import SpecRunnerHeaderOpenMode from './SpecRunnerHeaderOpenMode.vue'
import { useAutStore } from '../store'
import { SpecRunnerHeaderFragment, SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'

function renderWithGql (gqlVal: SpecRunnerHeaderFragment) {
  const eventManager = createEventManager()
  const autIframe = createTestAutIframe()

  return (<SpecRunnerHeaderOpenMode
    gql={{
      ...gqlVal,
      configFile: gqlVal.configFile || 'cypress.config.ts',
    }}
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
    cy.percySnapshot()
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
    cy.percySnapshot()
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

  it('links to aut url', () => {
    const autStore = useAutStore()
    const url = 'http://localhost:3000/todo'

    autStore.updateUrl(url)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.findByTestId('aut-url-input').invoke('val').should('contain', url)
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
    cy.percySnapshot()
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
    cy.percySnapshot()
  })

  it('shows generic browser icon when current browser icon is not configured', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (ctx) => {
        ctx.activeBrowser = ctx.browsers?.find((x) => x.displayName === 'Fake Browser') ?? null
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="select-browser"] > button img').should('have.attr', 'src', allBrowsersIcons.generic)
    cy.percySnapshot()
  })

  it('shows current viewport info', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql({
          ...gqlVal,
          configFile: 'cypress.config.js',
        })
      },
    })

    cy.get('[data-cy="viewport"]').click()
    cy.contains('The viewport determines').should('be.visible')
    cy.contains('Additionally, you can override this value in your cypress.config.js or via the cy.viewport() command.')
    .should('be.visible')

    cy.get('[data-cy="viewport"]').click()
    cy.contains('The viewport determines').should('be.hidden')
    cy.get('[data-cy="viewport"] button').focus().type(' ')
    cy.contains('The viewport determines').should('be.visible')
    cy.get('[data-cy="viewport"] button').focus().type('{enter}')
    cy.contains('The viewport determines').should('be.hidden')
  })

  it('links to the viewport docs', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql({
          ...gqlVal,
          currentTestingType: 'e2e',
        })
      },
    })

    cy.findByTestId('viewport').click()
    cy.findByTestId('viewport-docs')
    .should('be.visible')
    .should('have.attr', 'href', 'https://on.cypress.io/viewport')

    cy.contains('Additionally, you can override this value in your cypress.config.ts or via the cy.viewport() command.')
    .should('be.visible')

    cy.percySnapshot()
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

  it('opens and closes selector playground', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="playground-activator"]').click()
    cy.get('#selector-playground').should('be.visible')

    cy.percySnapshot()

    cy.get('[data-cy="playground-activator"]').click()
    cy.get('#selector-playground').should('not.exist')
  })
})
