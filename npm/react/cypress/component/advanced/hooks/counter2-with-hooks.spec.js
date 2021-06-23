/// <reference types="../../lib" />

import _ from 'lodash'
import React from 'react'
import ReactDom from 'react-dom'
import { mount } from '@cypress/react'
import Counter2WithHooks from './counter2-with-hooks.jsx'

it
describe('another', () => {
  it('fails', () => {
    expect(true).to.eq(false)
  })

  describe('another', () => {
    describe('another', () => {
      describe('another', () => {
        it('renders', () => {

        })

        it('renders', () => {

        })
      })

      it('renders', () => {

      })

      it('renders', () => {

      })
    })

    it('renders', () => {

    })

    it('renders', () => {

    })
  })

  it('renders', () => {

  })

  it('renders', () => {

  })
})

it('renders', () => {

})

describe('0 describe', function () {
  describe('deeper', () => {
    _.times(40, (n) => {
      if (Math.random() > 0.5) {
        Math.random() > 0.75 ? describe.skip : describe('suite ' + n, () => {
          it(`${n} might render`, function () {
          expect(Math.random()).to.be.gt(0.5)
          // expect(true).to.be(false)
          // mount(<Counter2WithHooks />, { React, ReactDom })
          // cy.contains('0')
          // cy.document().should('have.property', 'title', 'You clicked 0 times')

          // cy.log('Clicking changes document title')
          // cy.get('#increment')
          // .click()
          // .click()

          // cy.document().should('have.property', 'title', 'You clicked 2 times')
        })

      })
      it(`${n} might render`, function () {
        cy.get('body').should('exist')
        expect(Math.random()).to.be.gt(.90)
      })

      // expect(true).to.be(false)
      // mount(<Counter2WithHooks />, { React, ReactDom })
      // cy.contains('0')
      // cy.document().should('have.property', 'title', 'You clicked 0 times')

      // cy.log('Clicking changes document title')
      // cy.get('#increment')
      // .click()
      // .click()

      // cy.document().should('have.property', 'title', 'You clicked 2 times')
    })
  })

  // _.times(50, (n) => {
  //   it(`${n} might render`, function () {
  //     // expect(true).to.be(false)
  //     mount(<Counter2WithHooks />, { React, ReactDom })
  //     cy.contains('0')
  //     cy.document().should('have.property', 'title', 'You clicked 0 times')

  //     cy.log('Clicking changes document title')
  //     cy.get('#increment')
  //     .click()
  //     .click()

  //     cy.document().should('have.property', 'title', 'You clicked 2 times')
  //   })
  // })

  it('0.1 it', function () {
    expect(true).to.be(false)
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })

  describe('0.1 describe', () => {
    describe('0.0.1 describe', () => {
      xit('0.0.1 it', function () {
        mount(<Counter2WithHooks />, { React, ReactDom })
        cy.contains('0')
        cy.document().should('not.have.property', 'title', 'You clicked 0 times')

        cy.log('Clicking changes document title')
        cy.get('#increment')
        .click()
        .click()

        cy.document().should('have.property', 'title', 'You clicked 2 times')
      })

      describe('0.0.0.1 describe', () => {
        it('0.0.0.1 it', () => {

        })
      })
    })
  })

  it('0.2 it', function () {
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })

  it.skip('0.3 it', function () {
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })
})
