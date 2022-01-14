/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'

describe('style', () => {
  const backgroundColor = 'rgb(0, 255, 0)'
  const indexButtonHeight = '20px'
  const buttonHeightOverride = '50px'
  const className = `green`
  const indexStyle = `.${className} { background-color: ${backgroundColor}; height: ${indexButtonHeight}; }`
  const baseStyle = `.${className}.${className} { height: ${buttonHeightOverride} !important; }`

  context('options.style', () => {
    it('string', () => {
      const Component = () => <button className={className}>Green button</button>

      mount(<Component />, {
        style: indexStyle,
      })

      cy.get('button')
      .should('have.class', className)
      .and('have.css', 'background-color', backgroundColor)
    })

    it('string[]', () => {
      const Component = () => <button className={className}>Green button</button>

      mount(<Component />, {
        style: [indexStyle],
      })

      cy.get('button')
      .should('have.class', className)
      .and('have.css', 'background-color', backgroundColor)
    })
  })

  context('options.styles', () => {
    it('string', () => {
      const Component = () => <button className={className}>Green button</button>

      mount(<Component />, {
        styles: indexStyle,
        log: false,
      })

      cy.get('button')
      .should('have.class', className)
      .and('have.css', 'background-color', backgroundColor)
    })

    it('sets several', () => {
      const Component = () => {
        return (
          <button className={className}>Large green button</button>
        )
      }

      mount(<Component />, {
        styles: [baseStyle, indexStyle],
      })

      // check the style from the first css file
      cy.get('button')
      .should('have.class', className)
      .invoke('css', 'height')
      .should((value) => {
        // round the height, since in real browser it is never exactly 50
        expect(parseFloat(value), `height is ${buttonHeightOverride}`).to.be.closeTo(50, 1)
      })

      // and should have style from the second css file
      cy.get('button').and('have.css', 'background-color', backgroundColor)
    })

    it('resets the style', () => {
      const Component = () => {
        return (
          <button className={className}>Large green button</button>
        )
      }

      mount(<Component />)
      // the component should NOT have CSS styles

      cy.get('button')
      .should('have.class', className)
      .invoke('css', 'height')
      .should((value) => {
        expect(parseFloat(value), `height is < ${indexButtonHeight}`).to.be.lessThan(30)
      })
    })
  })
})
