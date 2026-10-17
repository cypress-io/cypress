import React from 'react'
import { mount } from '@cypress/react'
import { Button } from './Button'

describe('Button', () => {
  it('can be orange', () => {
    mount(<Button name="Orange" orange clickHandler={cy.stub()} />)

    cy.get('.component-button')
    .should('have.class', 'orange')
    .find('button')
    .should('have.css', 'background-color', 'rgb(245, 146, 62)')
  })
})
