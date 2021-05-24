let global_err = null

try {
  cy.currentTest()
} catch (e) {
  global_err = e
}

describe('currentTest', () => {
  let suite_err = null

  try {
    cy.currentTest()
  } catch (e) {
    suite_err = e
  }

  before(() => {
    expect(cy.currentTest().title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  beforeEach(() => {
    expect(cy.currentTest().title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  after(() => {
    expect(cy.currentTest().title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  afterEach(() => {
    expect(cy.currentTest().title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  it('returns current test runnable', () => {
    expect(cy.currentTest().title).eq(cy.state('runnable').title)
  })

  context('errors', () => {
    it('throws if outside test', () => {
      expect(global_err).property('message').contain('outside a test')
      expect(suite_err).property('message').contain('outside a test')
    })
  })
})
