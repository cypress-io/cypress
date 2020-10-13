/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('style', () => {
  let baseStyle
  let indexStyle

  before(() => {
    cy.readFile('cypress/component/basic/styles/css-file/base.css').then(
      css => {
        baseStyle = css
      },
    )
    cy.readFile('cypress/component/basic/styles/css-file/index.css').then(
      css => {
        indexStyle = css
      },
    )
  })

  context('options.style', () => {
    it('string', () => {
      const Component = () => <button className="green">Green button</button>
      mount(<Component />, {
        style: indexStyle,
      })

      cy.get('button')
        .should('have.class', 'green')
        .and('have.css', 'background-color', 'rgb(0, 255, 0)')
    })

    it('string[]', () => {
      const Component = () => <button className="green">Green button</button>
      mount(<Component />, {
        style: [indexStyle],
      })

      cy.get('button')
        .should('have.class', 'green')
        .and('have.css', 'background-color', 'rgb(0, 255, 0)')
    })
  })

  context('options.styles', () => {
    it('string', () => {
      const Component = () => <button className="green">Green button</button>
      mount(<Component />, {
        styles: indexStyle,
        log: false,
      })

      cy.get('button')
        .should('have.class', 'green')
        .and('have.css', 'background-color', 'rgb(0, 255, 0)')
    })

    it('sets several', () => {
      const Component = () => (
        <button className="green">Large green button</button>
      )
      mount(<Component />, {
        styles: [baseStyle, indexStyle],
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
  })
})
