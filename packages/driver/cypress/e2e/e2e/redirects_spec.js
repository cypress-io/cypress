const { assertLogLength } = require('../../support/utils')

describe('redirection', () => {
  beforeEach(function () {
    this.logs = []

    cy.on('log:added', (attrs, log) => {
      return this.logs.push(log)
    })

    return null
  })

  context('meta', () => {
    it('binds to the new page after a timeout', () => {
      cy
      .visit('/fixtures/meta-redirect-timeout.html')
      .contains('timeout')
      .then(function () {
        // visit, contains, page load, new url
        const receivedLogs = this.logs.reduce((prev, curr, index) => `${prev}, ${index}: ${curr.get('name')}`, '')

        assertLogLength(this.logs, 4, `received more logs than expected: ${receivedLogs}`)

        expect(this.logs[0].get('name')).to.eq('visit')
        expect(this.logs[1].get('name')).to.eq('contains')
        expect(this.logs[2].get('name')).to.eq('page load')
        expect(this.logs[3].get('name')).to.eq('new url')
      })
    })

    it('binds to the new page on immediate refresh', () => {
      cy
      .visit('/fixtures/meta-redirect.html')
      .get('a:first')
      .then(function () {
        // visit, get, page load, new url
        const receivedLogs = this.logs.reduce((prev, curr, index) => `${prev}, ${index}: ${curr.get('name')}`, '')

        assertLogLength(this.logs, 4, `received more logs than expected: ${receivedLogs}`)

        expect(this.logs[0].get('name')).to.eq('visit')
        expect(this.logs[1].get('name')).to.eq('get')
        expect(this.logs[2].get('name')).to.eq('page load')
        expect(this.logs[3].get('name')).to.eq('new url')
      })
    })
  })

  // TODO: broken - https://github.com/cypress-io/cypress/issues/4973 (chrome76+ and firefox)
  context.skip('javascript', () => {
    it('binds to the new page after a timeout', () => {
      cy
      .visit('/fixtures/js-redirect-timeout.html')
      .contains('timeout')
      .then(function () {
        // visit, contains, page load, new url
        assertLogLength(this.logs, 4)

        expect(this.logs[0].get('name')).to.eq('visit')
        expect(this.logs[1].get('name')).to.eq('contains')
        expect(this.logs[2].get('name')).to.eq('page load')
        expect(this.logs[3].get('name')).to.eq('new url')
      })
    })

    it('binds to the new page on immediate refresh', () => {
      cy
      .visit('/fixtures/js-redirect.html')
      .get('a:first')
      .then(function () {
        // visit, get, page load, new url
        assertLogLength(this.logs, 4)

        expect(this.logs[0].get('name')).to.eq('visit')
        expect(this.logs[1].get('name')).to.eq('get')
        expect(this.logs[2].get('name')).to.eq('page load')

        expect(this.logs[3].get('name')).to.eq('new url')
      })
    })
  })

  return null
})
