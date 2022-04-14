import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin waiting', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.wait()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.wait(500)
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

    it('.wait()', (done) => {
      cy.on('command:queue:end', () => {
        setTimeout(() => {
          const { consoleProps, crossOriginLog } = findCrossOriginLogs('wait', logs, 'foobar.com')

          expect(crossOriginLog).to.be.true
          expect(consoleProps.Command).to.equal('wait')
          expect(consoleProps).to.have.property('Waited For').to.equal('500ms before continuing')

          done()
        }, 250)
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.wait(500)
      })
    })
  })
})
