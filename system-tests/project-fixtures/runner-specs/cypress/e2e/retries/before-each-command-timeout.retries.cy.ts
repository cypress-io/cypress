let attempt = 0
const ranAfterLateCommand: number[] = []

// settles only after defaultCommandTimeout has failed the attempt
Cypress.Commands.add('settlesLate', () => new Cypress.Promise((resolve) => setTimeout(resolve, 1500)))

describe('suite', { retries: 1, defaultCommandTimeout: 500 }, () => {
  beforeEach(() => {
    attempt++

    if (attempt === 1) {
      // @ts-expect-error custom command defined above
      cy.settlesLate()
      cy.then(() => ranAfterLateCommand.push(attempt))
    }
  })

  it('passes on the retry after its beforeEach timed out', () => {
    // outlive the late command, which must not resume the first attempt's commands
    cy.wait(1500)
    cy.then(() => {
      expect(ranAfterLateCommand).to.deep.equal([])
    })
  })
})
