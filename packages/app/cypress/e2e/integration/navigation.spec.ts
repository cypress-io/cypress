import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { Interception } from '@packages/net-stubbing/lib/external-types'

describe('Navigation', () => {
  it('External links trigger mutation to open in a new browser', () => {
    cy.setupE2E('component-tests')
    cy.initializeApp()
    cy.visitApp()

    cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')
    cy.contains('button', defaultMessages.topNav.docsMenu.docsHeading).click()
    cy.contains('a', defaultMessages.topNav.docsMenu.firstTest).click()
    cy.wait('@OpenExternal').then((interception: Interception) => {
      expect(interception.request.body.variables.url).to.equal('https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test')
    })

    cy.get('[href="#/runs"]').click({ force: true }) // TODO(tim): figure out why this is flaky / covered?
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
  })
})
