// https://github.com/cypress-io/cypress/issues/1119
describe('issue 1119', () => {
  it('logs "contains 0" on cy.contains(0)', () => {
    cy.state('document').write('<span>0</span>')

    let lastLog

    cy.on('log:added', (_, log) => lastLog = log)

    cy.contains(0).then(() => {
      const lastLogText = `${lastLog.get('name')} ${lastLog.get('message')}`
      const expectedText = 'contains 0'

      expect(lastLogText).to.eq(expectedText)

      cy.removeAllListeners('log:added')
    })
  })
})
