/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { App } from './App'

describe('App', () => {
  it('plays well', () => {
    mount(<App />)

    cy.log('**parts that do not change**')
    // make sure the text has loaded and rendered
    cy.contains('New Game').should('be.visible')
    cy.contains('footer', 'Github').should('be.visible')

    cy.get('header').matchImageSnapshot('header')
    cy.get('.status__numbers').matchImageSnapshot('numbers')
    cy.get('.status__actions').matchImageSnapshot('actions')
    cy.get('.status__action-mistakes-mode-slider').click()
    cy.get('.status__action-fast-mode-slider').click()
    cy.get('.status__actions').matchImageSnapshot('actions with modes')

    // the board and the entire game are dynamic,
    // so unless you control the data the images would not match
    // cy.log('**the board**')
    // cy.get('section.game').matchImageSnapshot('board')

    // cy.log('**entire game**')
    // cy.get('.container').matchImageSnapshot('game')
  })
})
