import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin aliasing', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.as()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').as('checkbox')
      cy.get('@checkbox').click().should('be.checked')
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.as()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#button').as('buttonAlias')
      })

      cy.shouldWithTimeout(() => {
        const { alias, aliasType, consoleProps, $el } = findCrossOriginLogs('get', logs, 'foobar.com')

        // make sure $el is in fact a jquery instance to keep the logs happy
        expect($el.jquery).to.be.ok

        expect(alias).to.equal('buttonAlias')
        expect(aliasType).to.equal('dom')
        expect(consoleProps.Command).to.equal('get')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('#button')

        // The Yielded value here SHOULD be correct as it will be reified from its props as it should not be found in the current DOM state
        expect(consoleProps.Yielded.tagName).to.equal('BUTTON')
        expect(consoleProps.Yielded.getAttribute('id')).to.equal('button')
      })
    })
  })
})
