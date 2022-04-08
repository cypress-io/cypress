import { createEventManager, createTestAutIframe } from '../../../cypress/component/support/ctSupport'
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import SelectorPlayground from './SelectorPlayground.vue'
import { logger } from '../logger'

describe('SelectorPlayground', () => {
  const mountSelectorPlayground = (
    eventManager = createEventManager(),
    autIframe = createTestAutIframe(),
  ) => {
    return {
      autIframe,
      element: cy.mount(() => (
        <div class="py-64px">
          <SelectorPlayground
            eventManager={eventManager}
            getAutIframe={() => autIframe}
          />
        </div>
      )),
    }
  }

  it('populates cy.get by default with a selector of body', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')
    cy.get('[data-cy="selected-playground-method"]').should('contain', 'cy.get')
    cy.get('[data-cy="playground-selector"]').should('have.value', 'body')

    cy.percySnapshot()
  })

  it('toggles enabled', () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    expect(selectorPlaygroundStore.isEnabled).to.be.false

    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorPlayground')

    cy.get('[data-cy="playground-toggle"]').click().then(() => {
      expect(selectorPlaygroundStore.isEnabled).to.be.true
      expect(autIframe.toggleSelectorPlayground).to.have.been.called
      cy.percySnapshot('toggle-enabled')
    })
  })

  it('changes method from cy.get to cy.contains', () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')
    expect(selectorPlaygroundStore.method).to.eq('get')

    cy.get('[aria-label="Selector Methods"]').click()
    cy.findByRole('menuitem', { name: 'cy.contains' }).click().then(() => {
      expect(selectorPlaygroundStore.method).to.eq('contains')
      expect(autIframe.toggleSelectorHighlight).to.have.been.called
    })

    cy.get('[data-cy="selected-playground-method"]').should('contain', 'cy.contains')
  })

  it('shows query and number of found elements', () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    selectorPlaygroundStore.setNumElements(0)

    mountSelectorPlayground()
    cy.get('[data-cy="playground-num-elements"]').contains('No Matches')

    cy.then(() => selectorPlaygroundStore.setNumElements(1))

    cy.get('[data-cy="playground-num-elements"]').contains('1 Match')

    cy.then(() => selectorPlaygroundStore.setNumElements(10))

    cy.get('[data-cy="playground-num-elements"]').contains('10 Matches')

    cy.percySnapshot()

    cy.then(() => selectorPlaygroundStore.setValidity(false))

    cy.get('[data-cy="playground-num-elements"]').contains('Invalid')

    cy.percySnapshot('Invalid playground selector')
  })

  // TODO: UNIFY-999 Solve "write permission denied" error to test this in run mode
  it.skip('focuses and copies selector text', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')

    cy.get('[data-cy="playground-selector"]').as('copy').clear().type('.foo-bar')

    cy.get('@copy').click()
    cy.get('@copy').should('be.focused')

    cy.spy(navigator.clipboard, 'writeText').as('clipboardSpy')
    cy.get('[data-cy="playground-copy"]').click()
    cy.get('[data-cy="playground-copy-tooltip"]').should('be.visible').contains('Copied to clipboard')
    cy.get('@clipboardSpy').should('have.been.called')
  })

  it('prints nothing to console when no selected elements found', () => {
    mountSelectorPlayground()
    cy.spy(logger, 'logFormatted')
    cy.get('[data-cy="playground-selector"]').clear().type('.foo-bar')

    cy.get('[data-cy="playground-print"]').as('print')
    cy.get('@print').click().then(() => {
      expect(logger.logFormatted).to.have.been.calledWith({
        Command: `cy.get('.foo-bar')`,
        Yielded: 'Nothing',
      })
    })

    cy.get('[data-cy="playground-print-tooltip"]').should('be.visible').contains('Printed to console')
  })

  it('prints elements when selected elements found', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(logger, 'logFormatted')
    cy.stub(autIframe, 'getElements').callsFake(() => Array(2))

    cy.get('[data-cy="playground-selector"]').clear().type('.foo-bar')

    cy.get('[data-cy="playground-print"]').click().then(() => {
      expect(logger.logFormatted).to.have.been.calledWith({
        Command: `cy.get('.foo-bar')`,
        Elements: 2,
        Yielded: undefined, // stubbed dom does not actually return anything
      })
    })
  })
})
