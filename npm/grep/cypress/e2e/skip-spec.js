/* eslint-disable @cypress/dev/skip-comment */
/// <reference types="cypress" />
describe('tests that use .skip', () => {
  // use a template literal
  it(`works`, () => {})

  it.skip('is pending', () => {})

  it.skip('is pending again', () => {})
})
