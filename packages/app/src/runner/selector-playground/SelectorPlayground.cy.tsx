import { createEventManager, createTestAutIframe } from '../../../cypress/component/support/ctSupport'
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import SelectorPlayground from './SelectorPlayground.vue'

describe('SelectorPlayground', () => {
  const mountSelectorPlayground = (
    eventManager = createEventManager(),
    autIframe = createTestAutIframe(),
  ) => {
    return {
      autIframe,
      element: cy.mount(() => (
        <SelectorPlayground
          eventManager={eventManager}
          getAutIframe={() => autIframe}
        />
      )),
    }
  }

  it('populates cy.get by default with a selector of body', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')
    cy.get('[data-cy="playground-method"]').should('contain', 'cy.get')
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

    cy.get('[data-cy="playground-method"]').as('method')
    cy.get('@method').contains('cy.get').click()
    cy.get('li').contains('cy.contains').click().then(() => {
      expect(selectorPlaygroundStore.method).to.eq('contains')
      expect(autIframe.toggleSelectorHighlight).to.have.been.called
      cy.get('@method').contains('cy.contains')
    })
  })

  it('shows query and number of found elements', () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    selectorPlaygroundStore.setNumElements(10)

    mountSelectorPlayground()
    cy.get('[data-cy="playground-num-elements"]').contains('10')

    cy.percySnapshot()
  })

  it('focuses and copies selector text', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe, 'toggleSelectorHighlight')

    cy.get('[data-cy="playground-selector"]').as('copy').clear().type('.foo-bar')

    cy.get('@copy').click()
    cy.get('@copy').should('be.focused')

    cy.spy(document, 'execCommand')
    cy.get('[data-cy="playground-copy"]').click().then(() => {
      expect(document.execCommand).to.be.calledWith('copy')
    })
  })

  it('prints nothing to console when no selected elements found', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe.logger, 'logFormatted')
    cy.get('[data-cy="playground-selector"]').clear().type('.foo-bar')

    cy.get('[data-cy="playground-print"]').as('print')
    cy.get('@print').click().then(() => {
      expect(autIframe.logger.logFormatted).to.have.been.calledWith({
        Command: `cy.get('.foo-bar')`,
        Yielded: 'Nothing',
      })
    })
  })

  it('prints elements when selected elements found', () => {
    const { autIframe } = mountSelectorPlayground()

    cy.spy(autIframe.logger, 'logFormatted')
    cy.stub(autIframe, 'getElements').callsFake(() => Array(2))

    cy.get('[data-cy="playground-selector"]').clear().type('.foo-bar')

    cy.get('[data-cy="playground-print"]').click().then(() => {
      expect(autIframe.logger.logFormatted).to.have.been.calledWith({
        Command: `cy.get('.foo-bar')`,
        Elements: 2,
        Yielded: undefined, // stubbed dom does not actually return anything
      })
    })
  })
})
