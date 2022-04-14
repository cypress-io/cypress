/// <reference types="cypress" />
import { initEnv, mount } from '@cypress/angular'

describe('Integration tests', () => {
  it('works', () => {
    expect(1).to.equal(1)
  })

  it('throws an Error if I try to use mount', () => {
    cy.log('About to try using *mount*')
    expect(() => {
      mount(undefined)
    }).to.throw(
      'Angular component test from an integration spec is not allowed',
    )
  })

  it('throws an Error if I try to use initEnv', () => {
    cy.log('About to try using *initEnv*')
    expect(() => {
      initEnv(undefined)
    }).to.throw(
      'Angular component test from an integration spec is not allowed',
    )
  })
})
