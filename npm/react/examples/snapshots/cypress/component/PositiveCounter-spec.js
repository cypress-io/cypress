/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import PositiveCounter from './PositiveCounter'

// current version 1.4.3 of cypress-plugin-snapshots only works with
// objects and images.
// https://github.com/meinaart/cypress-plugin-snapshots/issues/122
it.skip('sanity check: string snapshots work', () => {
  cy.wrap('hello, world').toMatchSnapshot()
})

// utility child command that grabs element's HTML and snapshots its as an object
Cypress.Commands.add('toMatchHTML', { prevSubject: 'element' }, $el => {
  return cy
    .wrap({
      html: $el[0].outerHTML,
    })
    .toMatchSnapshot()
})

describe('PositiveCounter', () => {
  it('starts with zero', () => {
    mount(<PositiveCounter />)
    cy.contains('Value: 0')
      // previous command yields jQuery element
      // I would like to get its outer HTML which
      // we can do via $el[0].outerHTML shorthand
      .its('0.outerHTML')
      // convert text to JSON object for the snapshot plugin to work
      // https://github.com/meinaart/cypress-plugin-snapshots/issues/122
      .then(html => ({
        html,
      }))
      .toMatchSnapshot()

    // in other tests we will use utility child command .toMatchHTML()
  })

  it('should render counts', () => {
    mount(<PositiveCounter />)
    cy.get('.increment')
      .click()
      .click()
      .click()
    // make sure the component updates
    cy.contains('Value: 3').toMatchHTML()

    cy.get('.increment')
      .click()
      .click()
      .click()

    cy.contains('Value: 6').toMatchHTML()
  })

  it('should not go negative', () => {
    mount(<PositiveCounter />)
    cy.get('.increment').click()
    cy.get('.decrement')
      .click()
      .click()
    cy.contains('Value: 0').toMatchHTML()
  })

  it('snapshots the component state', () => {
    mount(<PositiveCounter />)
    cy.get('.increment')
      .click()
      .click()
      .click()
      .click()
    // The component's code set its reference
    // as a property on the "window" object
    // when running inside Cypress. This allows
    // the test to access it.
    cy.window()
      .its('PositiveCounter.state')
      .toMatchSnapshot()
  })
})
