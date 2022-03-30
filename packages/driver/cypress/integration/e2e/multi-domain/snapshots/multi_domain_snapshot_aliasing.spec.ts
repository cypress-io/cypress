import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot aliasing', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.as()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { alias, aliasType, consoleProps, $el, crossOriginLog } = findCrossOriginLogs('get', logs, 'foobar.com')

        // make sure $el is in fact a jquery instance to keep the logs happy
        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(alias).to.equal('buttonAlias')
        expect(aliasType).to.equal('dom')
        expect(consoleProps.Command).to.equal('get')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Selector).to.equal('#button')

        // The Yielded value here SHOULD be correct as it will be reified from its props as it should not be found in the current DOM state
        expect(consoleProps.Yielded.tagName).to.equal('BUTTON')
        expect(consoleProps.Yielded.getAttribute('id')).to.equal('button')
        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3250', () => {
      cy.get('#button').as('buttonAlias')
    })
  })
})
