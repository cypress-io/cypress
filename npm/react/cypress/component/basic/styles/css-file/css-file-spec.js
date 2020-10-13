/// <reference types="cypress" />
import React from 'react'
import { createMount, mount } from 'cypress-react-unit-test'

describe('cssFile', () => {
  it('is loaded', () => {
    const Component = () => <button className="green">Green button</button>
    mount(<Component />, {
      cssFiles: 'cypress/component/basic/styles/css-file/index.css',
    })

    cy.get('button')
      .should('have.class', 'green')
      .and('have.css', 'background-color', 'rgb(0, 255, 0)')
  })

  it('cssFile is for loading a single file', () => {
    const Component = () => <button className="green">Green button</button>
    mount(<Component />, {
      cssFile: 'cypress/component/basic/styles/css-file/index.css',
    })

    cy.get('button')
      .should('have.class', 'green')
      .and('have.css', 'background-color', 'rgb(0, 255, 0)')
  })

  it('allows loading several CSS files', () => {
    const Component = () => (
      <button className="green">Large green button</button>
    )
    mount(<Component />, {
      cssFiles: [
        'cypress/component/basic/styles/css-file/base.css',
        'cypress/component/basic/styles/css-file/index.css',
      ],
      log: false,
    })

    // check the style from the first css file
    cy.get('button')
      .should('have.class', 'green')
      .invoke('css', 'height')
      .should(value => {
        // round the height, since in real browser it is never exactly 50
        expect(parseFloat(value), 'height is 50px').to.be.closeTo(50, 1)
      })

    // and should have style from the second css file
    cy.get('button').and('have.css', 'background-color', 'rgb(0, 255, 0)')
  })

  it('resets the style', () => {
    const Component = () => (
      <button className="green">Large green button</button>
    )
    mount(<Component />)
    // the component should NOT have CSS styles

    cy.get('button')
      .should('have.class', 'green')
      .invoke('css', 'height')
      .should(value => {
        expect(parseFloat(value), 'height is < 30px').to.be.lessThan(30)
      })
  })

  context('Using createMount to simplify global css experience', () => {
    const mount = createMount({
      cssFiles: 'cypress/component/basic/styles/css-file/index.css',
    })

    it('createMount green button', () => {
      const Component = () => <button className="green">Green button</button>
      mount(<Component />)

      cy.get('button')
        .should('have.class', 'green')
        .and('have.css', 'background-color', 'rgb(0, 255, 0)')
    })

    it('createMount blue button', () => {
      const Component = () => <button className="blue">blue button</button>
      mount(<Component />)

      cy.get('button')
        .should('have.class', 'blue')
        .and('have.css', 'background-color', 'rgb(0, 0, 255)')
    })
  })
})
