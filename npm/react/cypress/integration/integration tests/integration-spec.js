/// <reference types="cypress" />
const React = require('react')
const { mount } = require('../../..')

describe('integration tests', () => {
  it('throws an Error if I try to use mount', () => {
    cy.log('About to try using *mount*')
    expect(() => {
      mount(<div>Example</div>)
    }).to.throw
  })
})
