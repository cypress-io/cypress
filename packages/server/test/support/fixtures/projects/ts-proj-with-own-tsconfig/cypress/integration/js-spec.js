import { add } from './math'

describe('JS spec', () => {
  it('adds 2 and 2 together', () => {
    expect(add(2, 2)).to.equal(4)
  })

  it('calls task', () => {
    cy.task('hello', 'TS').should('equal', 'Hello, TS!')
  })
})
