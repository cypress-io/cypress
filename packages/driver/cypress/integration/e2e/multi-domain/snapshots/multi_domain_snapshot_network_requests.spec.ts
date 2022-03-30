import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot network requests', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="request-link"]').click()
  })

  it('.request()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('request', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('request')

        expect(consoleProps.Request).to.have.property('Request Body').that.equals(null)
        expect(consoleProps.Request).to.have.property('Request Headers').that.is.a('object')
        expect(consoleProps.Request).to.have.property('Request URL').that.equals('http://www.foobar.com:3500/fixtures/example.json')
        expect(consoleProps.Request).to.have.property('Response Body').that.is.a('string')
        expect(consoleProps.Request).to.have.property('Response Headers').that.is.a('object')
        expect(consoleProps.Request).to.have.property('Response Status').that.equals(200)

        expect(consoleProps.Yielded).to.have.property('body').that.deep.equals({ example: true })
        expect(consoleProps.Yielded).to.have.property('duration').that.is.a('number')
        expect(consoleProps.Yielded).to.have.property('headers').that.is.a('object')
        expect(consoleProps.Yielded).to.have.property('status').that.equals(200)

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.request('http://www.foobar.com:3500/fixtures/example.json')
    })
  })
})
