import Counter from './lib/Counter.svelte'
import CounterProp from './lib/CounterProp.svelte'
import Context from './lib/Context.svelte'
import Store from './lib/Store.svelte'
import { messageStore } from './lib/store'

describe('Svelte mount', () => {
  it('mounts', () => {
    cy.mount(Counter)
    cy.contains('button', 'count is 0')
  })

  it('reacts to state changes', () => {
    cy.mount(Counter)
    cy.contains('button', 'count is 0')
    cy.get('button').click()
    cy.contains('button', 'count is 1')
  })

  it('accepts props', () => {
    cy.mount(CounterProp, { props: { count: 42 } })
    cy.contains('button', 'count is 42')
  })

  it('accepts context', () => {
    const payload = { msg: 'This value came from context!' }
    const context = new Map()

    context.set('myKey', payload)

    cy.mount(Context, { context })
    cy.contains('h1', payload.msg)
  })

  it('anchors mounted component', () => {
    cy.mount(Counter, { anchor: document.getElementById('anchor') })
    cy.get('[data-cy-root]').children().last().should('have.id', 'anchor')
  })

  it('reactive to writables', () => {
    cy.mount(Store)
    cy.contains('h1', 'Hello World!')

    cy.get('input').clear().type('New Message')
    cy.contains('h1', 'New Message')

    cy.then(() => messageStore.set('Written from spec'))
    cy.contains('h1', 'Written from spec')
  })

  context('log', () => {
    it('displays component name in mount log', () => {
      // svelte 5 in development mode is a function with the name data living on an internal symbol,
      // so we are unable to calculate the name. But production builds can correctly calculate the name on the object
      cy.mount(Counter, {
        log: true,
      })

      cy.wrap(Cypress.$(window.top.document.body)).within(() => {
        return cy
        .contains('displays component name in mount log')
        .closest('.collapsible')
        .click()
        .within(() => {
          return cy
          .get('.command-name-mount')
          .should('contain', 'mount<Counter ... />')
        })
      })
    })

    it('does not display mount log', () => {
      cy.mount(Counter)

      cy.wrap(Cypress.$(window.top.document.body)).within(() => {
        return cy
        .contains('does not display mount log')
        .closest('.collapsible')
        .click()
        .within(() => cy.get('.command-name-mount').should('not.exist'))
      })
    })
  })

  it('throws error when receiving removed mounting option', () => {
    Cypress.on('fail', (e) => {
      expect(e.message).to.contain('The `styles` mounting option is no longer supported.')

      return false
    })

    cy.mount(Counter, {
      styles: `body { background: red; }`,
    })
  })

  context('teardown', () => {
    beforeEach(() => {
      // component-index.html has anchor element within [data-cy-root] so base # of elements is 1
      cy.get('[data-cy-root]').children().should('have.length', 1)
    })

    it('should mount', () => {
      cy.mount(Counter)
    })

    it('should remove previous mounted component', () => {
      cy.mount(Counter)
      cy.contains('button', 'count is 0')
      cy.mount(CounterProp, { props: { count: 42 } })
      cy.contains('button', 'count is 42')

      cy.contains('button', 'count is 0').should('not.exist')
      cy.get('[data-cy-root]').children().should('have.length', 2)
    })
  })
})
