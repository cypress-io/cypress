/// <reference types="cypress" />
const React = require('react')
const { mount } = require('../../..')

describe('integration tests', () => {
  it('loads page for E2E', () => {
    cy.visit('index.html')
    cy.window().should('have.property', 'React')
  })

  it('loads page again', () => {
    cy.visit('index.html')
    cy.window().should('have.property', 'React')
  })

  it('throws an Error if I try to use mount', () => {
    cy.log('About to try using *mount*')
    expect(() => {
      mount(<div>Example</div>)
    }).to.throw
  })
})
