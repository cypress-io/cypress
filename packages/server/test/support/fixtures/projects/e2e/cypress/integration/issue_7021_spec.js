describe('suite', () => {
  before(() => {
    // will cause infinite top navigation
    cy.visit('http://localhost:3434')
  })

  beforeEach(() => {
  })

  it('test', () => {
  })

  afterEach(() => {
  })

  after(() => {
    // will cause infinite top navigation
    cy.visit('http://localhost:3434')
  })
})

describe('another suite', () => {
  it('causes domain navigation', () => {
    cy.visit('http://localhost:3535')
  })
})
