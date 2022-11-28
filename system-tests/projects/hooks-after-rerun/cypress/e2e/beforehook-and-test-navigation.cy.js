// should fail since before hooks are rerun on domain change

const urls = [
  'http://localhost:3434',
  'http://localhost:4545',
  'http://localhost:5656',
]

describe('initial domain change', () => {
  it('test', () => {
    cy.visit(urls[0])
  })
})

describe('suite', () => {
  before(() => {
    cy.visit(urls[1])
  })

  it('test', () => {})

  it('causes domain navigation', () => {
    cy.visit(urls[2])
  })
})

describe('navigation error in beforeEach', () => {
  before(() => {
    cy.visit(urls[1])
  })

  beforeEach(() => {
    cy.visit(urls[2])
  })

  it('never gets here', () => {})
})
