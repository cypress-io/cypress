const neverSettles = () => new Cypress.Promise(() => {})

describe('suite', { retries: 1, pageLoadTimeout: 500 }, () => {
  it('makes the next test fail to start once', () => {
    Cypress.once('test:before:run:async', neverSettles)
  })

  it('passes on the retry after failing to start', () => {
    Cypress.once('test:after:run:async', neverSettles)
  })

  it('still runs after a step between tests never finishes', () => {
    expect(true).to.equal(true)
  })
})
