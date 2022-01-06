import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Navigation', () => {
  before(() => {
    cy.scaffoldProject('todos')
  })

  it('External links trigger mutation to open in a new browser', () => {
    cy.openProject('todos')
    cy.startAppServer()
    cy.visitApp()

    cy.contains('button', defaultMessages.topNav.docsMenu.docsHeading).click()

    cy.validateExternalLink({
      name: defaultMessages.topNav.docsMenu.firstTest,
      href: 'https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test',
    })
  })
})
