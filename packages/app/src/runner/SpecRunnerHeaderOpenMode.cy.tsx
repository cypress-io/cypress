import SpecRunnerHeaderOpenMode from './SpecRunnerHeaderOpenMode.vue'
import { useAutStore, useSelectorPlaygroundStore } from '../store'
import { useStudioStore } from '../store/studio-store'
import { SpecRunnerHeaderFragment, SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'
import { ExternalLink_OpenExternalDocument } from '@packages/frontend-shared/src/generated/graphql'
import { cyGeneralGlobeX16 } from '@cypress-design/icon-registry'

function renderWithGql (gqlVal: SpecRunnerHeaderFragment, shouldShowStudioButton = false) {
  const eventManager = createEventManager()
  const autIframe = createTestAutIframe()

  return (<SpecRunnerHeaderOpenMode
    gql={{
      ...gqlVal,
      configFile: gqlVal.configFile || 'cypress.config.ts',
    }}
    eventManager={eventManager}
    getAutIframe={() => autIframe}
    shouldShowStudioButton={shouldShowStudioButton}
  />)
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
    cy.findByTestId('select-browser').should('be.visible').contains('title', 'Electron 73')
    cy.findByTestId('viewport-size').should('be.visible').contains('500x500')
  })

  describe('selector playground button', () => {
    it('is enabled by default', () => {
      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.get('[data-cy="playground-activator"]').should('not.be.disabled')
    })

    it('is disabled when isRunning is true', () => {
      const autStore = useAutStore()

      autStore.setIsRunning(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.get('[data-cy="playground-activator"]').should('be.disabled')
    })

    it('is disabled when isLoading is true', () => {
      const autStore = useAutStore()

      autStore.setIsLoading(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.get('[data-cy="playground-activator"]').should('be.disabled')
    })

    it('is visible by default', () => {
      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      cy.get('[data-cy="playground-activator"]').should('be.visible')
    })

    it('opens and closes selector playground', () => {
      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.findByTestId('playground-activator').click()
      cy.get('#selector-playground').should('be.visible')

      cy.percySnapshot()

      cy.findByTestId('playground-activator').click()
      cy.get('#selector-playground').should('not.exist')
    })
  })

  describe('url input', () => {
    it('shows url if currentTestingType is e2e', () => {
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
      // no reason to type in the url input
      cy.findByTestId('aut-url-input').should('have.prop', 'readOnly', true)
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

    it('opens aut url externally when url is readonly', () => {
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

    it('does not open url externally when url is not readonly', () => {
      const studioStore = useStudioStore()

      // This emulates the 'needsUrl' state in the studio store
      studioStore.setActive(true)
      studioStore.setUrl(undefined)
      studioStore._hasStarted = true

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
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
      cy.wrap(openExternalStub).should('not.have.been.called')
    })

    it('when currentTestingType is component, url has placeholder text', () => {
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
      cy.findByTestId('aut-url-input').should('have.prop', 'readOnly', true)
      cy.findByTestId('aut-url-input').should('have.prop', 'placeholder', 'URL navigation disabled in component testing')
      cy.findByTestId('viewport-size').should('be.visible').contains('500x500')
    })

    it('when studioStore.needsUrl is true, url input is enabled with Enter URL placeholder', () => {
      const studioStore = useStudioStore()

      // This emulates the 'needsUrl' state in the studio store
      studioStore.setActive(true)
      studioStore.setUrl(undefined)
      studioStore._hasStarted = true

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.findByTestId('aut-url-input').should('have.prop', 'readOnly', false)
      cy.findByTestId('aut-url-input').should('have.prop', 'placeholder', 'Enter URL')
      cy.percySnapshot()
    })

    it('shows cursor-pointer when url is readonly', () => {
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

      cy.findByTestId('aut-url-input').should('have.class', 'cursor-pointer')
    })

    it('shows cursor-text when url is not readonly', () => {
      const studioStore = useStudioStore()

      // This emulates the 'needsUrl' state in the studio store
      studioStore.setActive(true)
      studioStore.setUrl(undefined)
      studioStore._hasStarted = true

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.findByTestId('aut-url-input').should('have.class', 'cursor-text')
    })
  })

  describe('browser dropdown', () => {
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

    it('shows selected browser as first browser in dropdown', () => {
      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal)
        },
      })

      cy.get('[data-cy="select-browser"] > button').should('be.enabled').click()
      cy.get('[data-browser-id="1"]').should('contain', 'Electron').and('contain', 'Version 73')
      cy.get('[data-browser-id="1"]').find('[data-cy="top-nav-browser-list-selected-item"]')
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
  })

  describe('viewport info', () => {
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
  })

  describe('studio button', () => {
    it('shows studio button', () => {
      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      cy.findByTestId('studio-button').should('be.visible')
    })
  })

  describe('selector playground and studio recording interaction', () => {
    it('disables studio recording when selector playground opens', () => {
      const studioStore = useStudioStore()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      // Start with Studio active and recording enabled
      studioStore.setActive(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Verify recording is enabled initially
      cy.then(() => {
        expect(studioStore.canRecord).to.be.true
      })

      // Open Selector Playground
      cy.findByTestId('playground-activator').click()

      // Verify recording is disabled
      cy.then(() => {
        expect(selectorPlaygroundStore.show).to.be.true
        expect(studioStore.canRecord).to.be.false
      })
    })

    it('re-enables studio recording when selector playground closes', () => {
      const studioStore = useStudioStore()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      // Start with Studio active
      studioStore.setActive(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Open Selector Playground
      cy.findByTestId('playground-activator').click()

      cy.then(() => {
        expect(selectorPlaygroundStore.show).to.be.true
        expect(studioStore.canRecord).to.be.false
      })

      // Close Selector Playground
      cy.findByTestId('playground-activator').click()

      // Verify recording is re-enabled
      cy.then(() => {
        expect(selectorPlaygroundStore.show).to.be.false
        expect(studioStore.canRecord).to.be.true
      })
    })

    it('prevents event recording when selector playground is open', () => {
      const studioStore = useStudioStore()

      studioStore.setActive(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Open Selector Playground
      cy.findByTestId('playground-activator').click()

      // Create a mock event and element
      cy.then(() => {
        const mockEvent = { type: 'click', isTrusted: true } as any
        const mock$el = {
          prop: (prop: string) => {
            if (prop === 'tagName') {
              return 'BUTTON'
            }

            return undefined
          },
        } as any

        // _shouldRecordEvent should return false when SelectorPlayground is open
        expect(studioStore._shouldRecordEvent(mockEvent, mock$el)).to.be.false
      })

      // Close Selector Playground
      cy.findByTestId('playground-activator').click()

      // Now _shouldRecordEvent should return true (assuming other conditions are met)
      cy.then(() => {
        const mockEvent = { type: 'click', isTrusted: true } as any
        const mock$el = {
          prop: (prop: string) => {
            if (prop === 'tagName') {
              return 'BUTTON'
            }

            return undefined
          },
        } as any

        expect(studioStore._shouldRecordEvent(mockEvent, mock$el)).to.be.true
      })
    })

    it('disables recording when studio opens while selector playground is already open', () => {
      const studioStore = useStudioStore()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Open Selector Playground first
      cy.findByTestId('playground-activator').click()

      cy.then(() => {
        expect(selectorPlaygroundStore.show).to.be.true
      })

      // Now activate Studio
      studioStore.setActive(true)

      // Verify recording is disabled because SelectorPlayground is open
      cy.then(() => {
        expect(studioStore.isActive).to.be.true
        expect(studioStore.canRecord).to.be.false
      })
    })

    it('disables recording when tests are running', () => {
      const studioStore = useStudioStore()
      const autStore = useAutStore()

      studioStore.setActive(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Verify recording is enabled initially
      cy.then(() => {
        expect(studioStore.canRecord).to.be.true
      })

      // Set tests to running
      cy.then(() => {
        autStore.setIsRunning(true)
      })

      // Verify recording is disabled when tests are running
      cy.then(() => {
        expect(autStore.isRunning).to.be.true
        expect(studioStore.canRecord).to.be.false
        expect(studioStore._isRecordingDisabled).to.be.true
      })

      // Set tests to not running
      cy.then(() => {
        autStore.setIsRunning(false)
      })

      // Verify recording is re-enabled
      cy.then(() => {
        expect(autStore.isRunning).to.be.false
        expect(studioStore.canRecord).to.be.true
        expect(studioStore._isRecordingDisabled).to.be.false
      })
    })

    it('disables recording when tests are loading', () => {
      const studioStore = useStudioStore()
      const autStore = useAutStore()

      studioStore.setActive(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Verify recording is enabled initially
      cy.then(() => {
        expect(studioStore.canRecord).to.be.true
      })

      // Set tests to loading
      cy.then(() => {
        autStore.setIsLoading(true)
      })

      // Verify recording is disabled when tests are loading
      cy.then(() => {
        expect(autStore.isLoading).to.be.true
        expect(studioStore.canRecord).to.be.false
        expect(studioStore._isRecordingDisabled).to.be.true
      })

      // Set tests to not loading
      cy.then(() => {
        autStore.setIsLoading(false)
      })

      // Verify recording is re-enabled
      cy.then(() => {
        expect(autStore.isLoading).to.be.false
        expect(studioStore.canRecord).to.be.true
        expect(studioStore._isRecordingDisabled).to.be.false
      })
    })

    it('prevents event recording when tests are running', () => {
      const studioStore = useStudioStore()
      const autStore = useAutStore()

      studioStore.setActive(true)

      cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
        render: (gqlVal) => {
          return renderWithGql(gqlVal, true)
        },
      })

      // Set tests to running
      cy.then(() => {
        autStore.setIsRunning(true)
      })

      // Create a mock event and element
      cy.then(() => {
        const mockEvent = { type: 'click', isTrusted: true } as any
        const mock$el = {
          prop: (prop: string) => {
            if (prop === 'tagName') {
              return 'BUTTON'
            }

            return undefined
          },
        } as any

        // _shouldRecordEvent should return false when tests are running
        expect(studioStore._shouldRecordEvent(mockEvent, mock$el)).to.be.false
      })

      // Set tests to not running
      cy.then(() => {
        autStore.setIsRunning(false)
      })

      // Now _shouldRecordEvent should return true (assuming other conditions are met)
      cy.then(() => {
        const mockEvent = { type: 'click', isTrusted: true } as any
        const mock$el = {
          prop: (prop: string) => {
            if (prop === 'tagName') {
              return 'BUTTON'
            }

            return undefined
          },
        } as any

        expect(studioStore._shouldRecordEvent(mockEvent, mock$el)).to.be.true
      })
    })
  })
})
