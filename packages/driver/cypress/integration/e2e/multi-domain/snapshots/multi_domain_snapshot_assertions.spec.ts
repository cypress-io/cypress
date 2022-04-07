import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot assertions', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.should() and .and()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const assertionLogs = findCrossOriginLogs('assert', logs, 'foobar.com')

        expect(assertionLogs[0].consoleProps.Message).to.equal('expected <input> not to be checked')
        expect(assertionLogs[1].consoleProps.Message).to.equal('expected <input> not to be disabled')

        assertionLogs.forEach(({ $el, crossOriginLog, consoleProps }) => {
          expect($el.jquery).to.be.ok
          expect(crossOriginLog).to.be.true

          expect(consoleProps.Command).to.equal('assert')
          expect(consoleProps.subject[0]).to.have.property('tagName').that.equals('INPUT')
          expect(consoleProps.subject[0]).to.have.property('value').that.equals('blue')
          expect(consoleProps.subject[0].getAttribute('name')).to.equal('colors')
        })

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .should('not.be.checked').and('not.be.disabled')
    })
  })
})
