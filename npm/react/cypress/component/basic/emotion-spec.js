import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Emotion, Emotion2 } from './emotion.jsx'

describe('Emotion css-in-js component', () => {
  it('renders css', () => {
    mount(<Emotion />)

    cy.contains('Emotion').should('have.css', 'color', 'rgb(255, 105, 180)')
  })

  it('renders second component', () => {
    mount(<Emotion2 />)
    cy.get('[class^=css]').should('have.css', 'color', 'rgb(0, 0, 255)')
  })
})
