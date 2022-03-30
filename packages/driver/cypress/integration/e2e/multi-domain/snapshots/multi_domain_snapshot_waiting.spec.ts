import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot waiting', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
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

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.wait(500)
    })
  })
})
