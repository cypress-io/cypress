import React from 'react'
import { mount } from 'cypress/react'

describe('webpack-dev-server', () => {
  it('image with relative path should load', () => {
    mount(<img src="./quak.png" />)
    cy.get('img').should('be.visible').then(($img) => {
      expect($img[0].naturalWidth).to.be.greaterThan(0)
    })
  })
})
