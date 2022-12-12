/* eslint-disable @cypress/dev/skip-comment */
/// <reference types="cypress" />
describe('tests that use .skip', () => {
  // use a template literal
  it(`works`, () => {})

  // NOTE: These are skipped on purposed to validate these scenarios
  it.skip('is pending', () => {})

  // NOTE: These are skipped on purposed to validate these scenarios
  it.skip('is pending again', () => {})
})
