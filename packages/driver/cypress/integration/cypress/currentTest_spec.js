let rootErr = null

try {
  Cypress.currentTest
} catch (e) {
  rootErr = e
}

describe('currentTest', () => {
  let suiteErr = null

  try {
    Cypress.currentTest
  } catch (e) {
    suiteErr = e
  }
  before(() => {
    expectMatchingCurrentTitleInHook()
  })

  beforeEach(() => {
    expectMatchingCurrentTitleInHook()
  })

  after(() => {
    expectMatchingCurrentTitleInHook()
  })

  afterEach(() => {
    expectMatchingCurrentTitleInHook()
  })

  it('returns current test runnable', () => {
    expect(Cypress.currentTest.title)
    .is.a('string')
    .eq(cy.state('runnable').title)
  })

  context('errors', () => {
    it('throws if outside test', () => {
      expect(rootErr).property('message').contain('outside a test')
      expect(suiteErr).property('message').contain('outside a test')
    })

    it('throws if outside test with codeframe - root', (done) => {
      cy.on('fail', (err) => {
        expect(err.codeFrame.line).eq(4)
        done()
      })

      throw rootErr
    })

    it('throws if outside test with codeframe - suite', (done) => {
      cy.on('fail', (err) => {
        expect(err.codeFrame.line).eq(13)
        done()
      })

      throw suiteErr
    })
  })
})

const expectMatchingCurrentTitleInHook = () => {
  expect(Cypress.currentTest.title)
  .is.a('string')
  .eq(cy.state('runnable').ctx.currentTest.title)
}
