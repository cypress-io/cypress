import { createEventManager, createTestAutIframe } from '../../../cypress/component/support/ctSupport'
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import { Clipboard_CopyToClipboardDocument } from '../../generated/graphql-test'
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
        <div class="py-[64px]">
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
  })

  it('toggles enabled', () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    expect(selectorPlaygroundStore.isEnabled).to.be.false

    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorPlayground')

    cy.get('[data-cy="playground-toggle"]').click().then(() => {
      expect(selectorPlaygroundStore.isEnabled).to.be.true
      expect(autIframe.toggleSelectorPlayground).to.have.been.called
      /*
        TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
        cy.percySnapshot('toggle-enabled')
      */
    })
  })

  it('changes method from cy.get to cy.contains', () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')
    expect(selectorPlaygroundStore.method).to.eq('get')

    cy.get('[aria-label="Selector methods"]').click()
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
    cy.get('[data-cy="playground-num-elements"]').contains('No matches')

    cy.then(() => selectorPlaygroundStore.setNumElements(1))

    cy.get('[data-cy="playground-num-elements"]').contains('1 match')

    cy.then(() => selectorPlaygroundStore.setNumElements(10))

    cy.get('[data-cy="playground-num-elements"]').contains('10 matches')

    cy.then(() => selectorPlaygroundStore.setValidity(false))

    cy.get('[data-cy="playground-num-elements"]').contains('Invalid')
  })

  it('focuses and copies selector text', () => {
    const copyStub = cy.stub()

    cy.stubMutationResolver(Clipboard_CopyToClipboardDocument, (defineResult, { text }) => {
      copyStub(text)

      return defineResult({
        copyTextToClipboard: true,
      })
    })

    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')

    cy.get('[data-cy="playground-selector"]').as('copy').clear().type('.foo-bar')

    cy.get('@copy').click()
    cy.get('@copy').should('be.focused')

    // trigger mouseleave on print button to ensure tooltip is not showing
    // sometimes there's flake in CI because mouse position is over "print to console" button
    cy.get('[data-cy="playground-print"]').trigger('mouseleave')

    cy.get('[data-cy="playground-copy"]').trigger('mouseenter')
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Copy to clipboard')

    // TODO: fix flaky snapshot https://github.com/cypress-io/cypress/issues/23436
    // cy.percySnapshot('Copy to clipboard hover tooltip')

    cy.get('[data-cy="playground-copy"]').click()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Copied!')

    // TODO: fix flaky snapshot https://github.com/cypress-io/cypress/issues/23436
    // cy.percySnapshot('Copy to clipboard click tooltip')

    cy.wrap(copyStub).should('have.been.calledWith', 'cy.get(\'.foo-bar\')')
  })

  it('prints elements when selected elements found', () => {
    const { autIframe } = mountSelectorPlayground()
    const fakeJQueryElements = Array(2)

    // It is necessary to mimic JQuery behavior.
    // @ts-ignore
    fakeJQueryElements.get = () => fakeJQueryElements

    cy.spy(logger, 'logFormatted')
    cy.stub(autIframe, 'getElements').callsFake((() => fakeJQueryElements))

    cy.get('[data-cy="playground-selector"]').clear().type('.foo-bar')

    cy.get('[data-cy="playground-print"]').trigger('mouseenter')
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Print to console')

    /*
      TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
      cy.percySnapshot('Print to console hover tooltip')
    */

    cy.get('[data-cy="playground-print"]').click()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Printed!')
    /*
      TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
      cy.percySnapshot('Print to console click tooltip')
    */
    cy.then(() => {
      expect(logger.logFormatted).to.have.been.calledWith({
        name: `cy.get('.foo-bar')`,
        type: 'command',
        props: {
          Elements: 2,
          Yielded: undefined, // stubbed dom does not actually return anything
        },
      })
    })
  })

  it('prints nothing to console when no selected elements found', () => {
    mountSelectorPlayground()
    cy.spy(logger, 'logFormatted')
    cy.get('[data-cy="playground-selector"]').clear().type('.foo-bar')

    cy.get('[data-cy="playground-print"]').as('print')
    cy.get('@print').click().then(() => {
      expect(logger.logFormatted).to.have.been.calledWith({
        name: `cy.get('.foo-bar')`,
        type: 'command',
        props: {
          Yielded: 'Nothing',
        },
      })
    })
  })

  // TODO: fix this flaky test
  it.skip('shows tooltips when buttons are focused', () => {
    mountSelectorPlayground()

    cy.get('[data-cy="playground-toggle"]').focus()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Click an element to see a suggested selector')
    cy.get('[data-cy="playground-toggle"]').trigger('mouseleave')
    cy.get('[data-cy="selector-playground-tooltip"]').should('not.exist')

    cy.get('[data-cy="playground-copy"]').focus()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Copy to clipboard')
    cy.get('[data-cy="playground-copy"]').click()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Copied')
    cy.get('[data-cy="playground-copy"]').trigger('mouseleave')
    cy.get('[data-cy="selector-playground-tooltip"]').should('not.exist')

    cy.get('[data-cy="playground-print"]').focus()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Print to console')
    cy.get('[data-cy="playground-print"]').click()
    cy.get('[data-cy="selector-playground-tooltip"]').should('be.visible').contains('Printed')
    cy.get('[data-cy="playground-print"]').trigger('mouseleave')
    cy.get('[data-cy="selector-playground-tooltip"]').should('not.exist')
  })

  it('ensures input autocomplete is disabled', () => {
    mountSelectorPlayground()

    cy.get('[data-cy="playground-selector"]').should('have.attr', 'autocomplete', 'off')
  })
})
