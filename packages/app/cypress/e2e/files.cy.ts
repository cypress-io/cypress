import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('files', () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer()
  })

  it('resolves the home page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})

describe('example files', () => {
  it('should create example files on an empty project', () => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine')
    cy.startAppServer()
    cy.visitApp()
    cy.wait(1000)
    cy.contains('[data-cy="card"]', defaultMessages.createSpec.e2e.importFromScaffold.header).click()
    // TODO: Check that the popup stays open
    cy.withCtx(async (ctx, { testState }) => {
      ctx.actions.file.checkIfFileExists('cypress/e2e/1-getting-started/todo.cy.ts')
    })
  })
})
