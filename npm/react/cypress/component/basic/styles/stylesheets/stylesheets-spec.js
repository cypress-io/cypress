/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('stylesheets', () => {
  const baseUrl = '/__root/cypress/component/basic/styles/css-file/base.css'
  const indexUrl = '/__root/cypress/component/basic/styles/css-file/index.css'

  context('options.stylesheet', () => {
    it('options.stylesheet string', () => {
      const Component = () => <button className="green">Green button</button>
      mount(<Component />, {
        stylesheet: indexUrl,
      })

      cy.get('button')
        .should('have.class', 'green')
        .and('have.css', 'background-color', 'rgb(0, 255, 0)')
    })

    it('options.stylesheet []', () => {
      const Component = () => <button className="green">Green button</button>
      mount(<Component />, {
        stylesheet: [indexUrl],
      })

      cy.get('button')
        .should('have.class', 'green')
        .and('have.css', 'background-color', 'rgb(0, 255, 0)')
    })
  })

  context('options.stylesheets', () => {
    it('allows loading several CSS files', () => {
      const Component = () => (
        <button className="green">Large green button</button>
      )
      mount(<Component />, {
        stylesheets: [baseUrl, indexUrl],
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
          // meaning: the style has been reset
          expect(parseFloat(value), 'height is < 30px').to.be.lessThan(30)
        })
    })
  })
})
