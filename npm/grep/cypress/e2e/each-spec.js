/// <reference types="cypress" />

// https://github.com/bahmutov/cypress-each
import 'cypress-each'

describe('tests that use .each work', () => {
  // creating tests dynamically works with "cypress-grep"
  it.each([1, 2, 3])('test for %d', (x) => {
    expect(x).to.be.oneOf([1, 2, 3])
  })
})
