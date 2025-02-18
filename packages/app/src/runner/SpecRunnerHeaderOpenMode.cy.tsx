import SpecRunnerHeaderOpenMode from './SpecRunnerHeaderOpenMode.vue'
import { useAutStore } from '../store'
import { SpecRunnerHeaderFragment, SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'
import { ExternalLink_OpenExternalDocument } from '@packages/frontend-shared/src/generated/graphql'
import { cyGeneralGlobeX16 } from '@cypress-design/icon-registry'

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
    const autUrl = 'http://localhost:4000'

    autStore.updateUrl(autUrl)
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.findByTestId('aut-url-input').should('be.visible').should('have.value', autUrl)
    cy.findByTestId('select-browser').should('be.visible').contains('Electron 73')
    cy.findByTestId('viewport-size').should('be.visible').contains('500x500')
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
    const autUrl = 'http://localhost:3000'

    autStore.updateUrl(autUrl)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="aut-url"]').should('exist')
    cy.findByTestId('aut-url-input').should('be.visible').should('have.value', autUrl)
    cy.findByTestId('viewport-size').should('be.visible').contains('500x500')
  })

  it('url section handles long url/small viewport', {
    viewportWidth: 500,
  }, () => {
    const autStore = useAutStore()
    const autUrl = 'http://localhost:3000/pretty/long/url.spec.jsx'

    autStore.updateUrl(autUrl)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.get('[data-cy="aut-url"]').should('exist')
    cy.findByTestId('aut-url-input').should('be.visible').should('have.value', autUrl)
    cy.findByTestId('select-browser').should('be.visible').contains('Electron 73')
    cy.findByTestId('viewport-size').should('be.visible').contains('500x500')
    cy.percySnapshot()
  })

  it('links to aut url', () => {
    const autStore = useAutStore()
    const autUrl = 'http://localhost:3000/todo'

    autStore.updateUrl(autUrl)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.findByTestId('aut-url-input').invoke('val').should('contain', autUrl)
  })

  it('opens aut url externally', () => {
    const autStore = useAutStore()
    const autUrl = 'http://localhost:3000/todo'

    autStore.updateUrl(autUrl)

    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      onResult: (gql) => {
        gql.currentTestingType = 'e2e'
      },
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    const openExternalStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      openExternalStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.findByTestId('aut-url-input').click()
    cy.wrap(openExternalStub).should('have.been.calledWith', 'http://localhost:3000/todo')
  })

  it('disables url section if currentTestingType is component', () => {
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

    cy.findByTestId('playground-activator').should('be.visible')
    cy.findByTestId('aut-url-input').should('be.disabled')
    cy.findByTestId('aut-url-input').should('have.prop', 'placeholder', 'URL navigation disabled in component testing')
    cy.findByTestId('viewport-size').should('be.visible').contains('500x500')
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

    cy.findByTestId('select-browser').contains('Fake Browser')

    cy.get('[data-cy="select-browser"] > button svg').eq(0).children().verifyBrowserIconSvg(cyGeneralGlobeX16.data)
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

    cy.get('[data-cy="viewport-size"]').contains('500x500')
  })

  it('shows scale % in viewport info', () => {
    const autStore = useAutStore()

    autStore.setScale(0.4)
    autStore.updateUrl('http://localhost:3000/todo')
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql({
          ...gqlVal,
          configFile: 'cypress.config.js',
        })
      },
    })

    cy.get('[data-cy="viewport-scale"]').contains('40%')
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

    cy.findByTestId('select-browser').should('be.visible').contains('Chrome 78')
    cy.get('[data-cy="select-browser"] > button').should('be.disabled')
  })

  it('opens and closes selector playground', () => {
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return renderWithGql(gqlVal)
      },
    })

    cy.findByTestId('playground-activator').click()
    cy.get('#selector-playground').should('be.visible')

    cy.findByTestId('playground-activator').click()
    cy.get('#selector-playground').should('not.exist')
  })
})
