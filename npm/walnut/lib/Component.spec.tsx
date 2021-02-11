/// <reference types="cypress" />

/**
 * Importing React does _not_ work at all.
 * @cypress/vite-dev-server has an issue with transforming html
 * We're missing the react preamble when we respond with the dynamic index template
 * See CT-266
 */

// import { mount } from '@cypress/react'
// import { Component } from './Component'

xdescribe('Component', () => {
  it(`should render, but it doesn't yet`, () => {
    expect(true).to.be.true
  })
})
