import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot viewport', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.viewport()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('viewport', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('viewport')
        expect(consoleProps.Width).to.equal(320)
        expect(consoleProps.Height).to.equal(480)

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.viewport(320, 480)
    })
  })
})
