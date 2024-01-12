const { expect } = require('chai')

const { getResolvedMessage } = require('../../src/semantic-commits/get-resolve-message')

describe('semantic-commits/get-resolve-message', () => {
  it('returned pr link', () => {
    const message = getResolvedMessage('feat', 52, [])

    expect(message).to.eq('Addressed in [#52](https://github.com/cypress-io/cypress/pull/52).')
  })

  it('returns linked issue', () => {
    const message = getResolvedMessage('feat', 52, [39])

    expect(message).to.eq('Addresses [#39](https://github.com/cypress-io/cypress/issues/39).')
  })

  it('returns all linked issues', () => {
    let message = getResolvedMessage('feat', 52, [39, 20])

    expect(message).to.eq('Addresses [#20](https://github.com/cypress-io/cypress/issues/20) and [#39](https://github.com/cypress-io/cypress/issues/39).')

    message = getResolvedMessage('feat', 52, [39, 20, 30])

    expect(message).to.eq('Addresses [#20](https://github.com/cypress-io/cypress/issues/20), [#30](https://github.com/cypress-io/cypress/issues/30) and [#39](https://github.com/cypress-io/cypress/issues/39).')
  })
})
