/// <reference types="cypress" />
import React from 'react'
import App from './App'
import { mount } from 'cypress-react-unit-test'

describe('static resources', () => {
  const findResource = name => {
    return window.performance
      .getEntriesByType('resource')
      .find(item => item.name.endsWith(name))
  }

  it.only('loads SVG', () => {
    // checking if a static resource like a font has loaded
    // based on the recipe "Waiting for static resource"
    // https://github.com/cypress-io/cypress-example-recipes#testing-the-dom
    mount(<App />)

    // use wrap + .should() to retry the callback function
    cy.wrap().should(() => {
      const foundResource = findResource('logo.svg')
      expect(foundResource).to.have.property('initiatorType', 'img')
    })
  })

  it('loads font', () => {
    // https://github.com/bahmutov/cypress-react-unit-test/issues/284
    mount(<App />)

    cy.wrap().should(() => {
      const foundResource = findResource('Inter-Regular.woff')
      expect(foundResource).to.have.property('initiatorType', 'css')
    })
  })
})
