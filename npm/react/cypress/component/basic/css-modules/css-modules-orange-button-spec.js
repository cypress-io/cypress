/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import styles from './Button.modules.css'
import { Button } from './Button.jsx'

describe('Button', () => {
  it('renders orange styles', () => {
    mount(<Button name="Orange" orange />)

    cy.get('div > button')
      .parent()
      .should('have.class', styles.orange)
      .find('button')
      .should('have.css', 'background-color', 'rgb(245, 146, 62)')
  })
})
