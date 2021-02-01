/// <reference types="cypress"/>

const { expect } = require('chai')

beforeEach(() => {
  expect(true).ok
})

before(() => {
  expect(true).ok
})

describe('test muting', { env: { SUITE_ENV_VAR: '1' }, scrollBehavior: 'center' }, () => {
  beforeEach(() => {
    expect(true).ok
  })

  afterEach(() => {
    expect(true).ok
  })

  it('pass', { env: { TEST_ENV_VAR: '1' } }, () => {
    cy.visit('http://localhost:3131')
    .then(() => {
      expect(true).ok
    })
  })

  it('muted fail 1', () => {
    expect(false).ok
  })

  it('muted fail 2', () => {
    cy.visit('http://127.0.0.1:3131')
    .then(() => {
      expect(false).ok
    })
  })

  it('muted pass', () => {
    // assert UI has been properly rehydrated

    // previously muted test should have muted prepended
    cy.wrap(cy.$$('.runnable-title:nth(2)', top.document))
    .should('contain', 'mutedmuted fail 1')

    // stats should show 0 failures
    cy.wrap(cy.$$('.stats .failed', top.document)).should('contain', '--')
  })
})
