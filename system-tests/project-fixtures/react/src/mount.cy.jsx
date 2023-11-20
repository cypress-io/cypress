import React from 'react'

const HelloWorld = ({ msg }) => {
  return <h1>{msg}</h1>
}

describe('mount', () => {
  context('teardown', () => {
    beforeEach(() => {
      cy.get('[data-cy-root]').children().should('have.length', 0)
    })

    it('should mount', () => {
      cy.mount(<HelloWorld />)
    })

    it('should remove previous mounted component', () => {
      cy.mount(<HelloWorld msg="Render 1" />)
      cy.contains('Render 1')
      cy.mount(<HelloWorld msg="Render 2" />)
      cy.contains('Render 2')

      cy.contains('Render 1').should('not.exist')
      cy.get('[data-cy-root]').children().should('have.length', 1)
    })
  })

  it('does not error when rendering primitives', () => {
    cy.mount('Hello World')
    cy.mount(5)
    cy.mount(null)
    cy.mount(undefined)
  })
})
