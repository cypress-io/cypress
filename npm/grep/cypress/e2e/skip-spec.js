/// <reference types="cypress" />
describe('tests that use .skip', () => {
  // use a template literal
  it(`works`, () => {})

  // NOTE: This test is pending for demonstration
  it.skip('is pending', () => {})

  // NOTE: This test is also pending for demonstration
  it.skip('is pending again', () => {})
})
