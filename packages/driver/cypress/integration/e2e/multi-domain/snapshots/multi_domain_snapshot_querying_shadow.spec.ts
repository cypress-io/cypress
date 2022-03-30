import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot shadow dom', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="shadow-dom-link"]').click()
  })

  it('.shadow()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('shadow', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('shadow')
        expect(consoleProps.Elements).to.equal(1)

        expect(consoleProps['Applied To']).to.have.property('tagName').that.equals('CY-TEST-ELEMENT')
        expect(consoleProps['Applied To']).to.have.property('id').that.equals('shadow-element-1')

        expect(consoleProps.Yielded).to.be.null

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#shadow-element-1').shadow()
    })
  })
})
