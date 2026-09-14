describe('Hooks', () => {
  before(() => {
    cy.wrap('before all')
  })

  beforeEach(() => {
    cy.wrap('before each')
  })

  afterEach(() => {
    cy.wrap('after each')
  })

  it('logs nothing of its own', () => {
    // No test-body row to win the tie, so row 1 exists only in the hook
    // sections — the one shape an unqualified "1" cannot resolve.
  })

  it('logs a command of its own', () => {
    cy.wrap('test body')
  })

  // NOTE: pending on purpose — a pending test renders its own badge and has no
  // command log to show.
  it.skip('never runs', () => {
    cy.wrap('unreachable')
  })

  describe('Nested', () => {
    it('is reported under the full suite path', () => {
      cy.wrap('nested')
    })
  })
})
