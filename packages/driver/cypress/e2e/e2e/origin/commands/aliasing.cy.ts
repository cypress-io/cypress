import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin aliasing', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
  })

  context('.as()', () => {
    it('supports dom elements inside origin', () => {
      cy.get('a[data-cy="dom-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get(':checkbox[name="colors"][value="blue"]').as('checkbox')
        cy.get('@checkbox').click().should('be.checked')
      })
    })

    it('fails for dom elements outside origin', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.get()` could not find a registered alias for: `@link`.\nYou have not aliased anything yet.')
        done()
      })

      cy.get('[data-cy="cross-origin-secondary-link"]').as('link')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('@link').click()
      })
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
      cy.get('a[data-cy="dom-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#button').as('buttonAlias')
      })

      cy.shouldWithTimeout(() => {
        const { alias, aliasType, consoleProps, $el } = findCrossOriginLogs('get', logs, 'foobar.com')

        // make sure $el is in fact a jquery instance to keep the logs happy
        expect($el.jquery).to.be.ok

        expect(alias).to.equal('@buttonAlias')
        expect(aliasType).to.equal('dom')
        expect(consoleProps.name).to.equal('get')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('#button')

        // The Yielded value here SHOULD be correct as it will be reified from its props as it should not be found in the current DOM state
        expect(consoleProps.props.Yielded.tagName).to.equal('BUTTON')
        expect(consoleProps.props.Yielded.getAttribute('id')).to.equal('button')
      })
    })
  })
})
