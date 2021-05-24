let global_err = null

try {
  Cypress.currentTest
} catch (e) {
  global_err = e
}

describe('currentTest', () => {
  let suite_err = null

  try {
    Cypress.currentTest
  } catch (e) {
    suite_err = e
  }

  before(() => {
    expect(Cypress.currentTest.title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  beforeEach(() => {
    expect(Cypress.currentTest.title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  after(() => {
    expect(Cypress.currentTest.title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  afterEach(() => {
    expect(Cypress.currentTest.title).eq(cy.state('runnable').ctx.currentTest.title)
  })

  it('returns current test runnable', () => {
    expect(Cypress.currentTest.title).eq(cy.state('runnable').title)
  })

  context('errors', () => {
    it('throws if outside test', () => {
      expect(global_err).property('message').contain('outside a test')
      expect(suite_err).property('message').contain('outside a test')
    })

    it('throws if outside test with codeframe', (done) => {
      cy.on('fail', (err) => {
        expect(err.codeFrame.line).eq(4)
        done()
      })

      throw global_err
    })
  })
})
