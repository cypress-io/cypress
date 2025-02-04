// entire game from the tutorial inside the spec for simplicity
// the code taken from https://codepen.io/gaearon/pen/LyyXgK
/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import Game from './tic-tac-toe.jsx'
import './tic-tac-toe.css'

describe('Tic Tac Toe', () => {
  /**
   * Clicks on a square, give
   * @param {number} row 0 based
   * @param {number} column 0 based
   */
  const clickSquare = (row, column) => cy.get('.square').eq(row * 3 + column)

  beforeEach(() => {
    cy.viewport(200, 200)
  })

  it('starts and lets X win', () => {
    mount(<Game />)

    cy.contains('.status', 'Next player: X')
    clickSquare(0, 0).click()
    cy.contains('.status', 'Next player: O')
    clickSquare(0, 1).click()

    clickSquare(1, 0).click()
    clickSquare(1, 1).click()

    clickSquare(2, 0).click()
    cy.contains('.status', 'Winner: X')
  })
})
