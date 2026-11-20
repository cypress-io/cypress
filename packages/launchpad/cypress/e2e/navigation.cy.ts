import type { Interception } from '@packages/network-interception'

describe('Navigation', () => {
  it('External links trigger mutation to open in a new browser', () => {
    cy.openGlobalMode()
    cy.visitLaunchpad()

    cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')
    cy.contains('button', 'Docs').click()
    cy.contains('a', 'Write your first test').click()
    cy.wait('@OpenExternal').then((interception: Interception) => {
      expect(interception.request.body.variables.url).to.equal('https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test&utm_source=Binary%3A+Launchpad')
    })
  })
})
