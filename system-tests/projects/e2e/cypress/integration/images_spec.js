/* eslint-disable no-undef */
describe('images', () => {
  it('can correctly load images when served from http server', () => {
    cy.visit('http://localhost:3636')
    cy.window().then((win) => {
      return new Cypress.Promise((resolve, reject) => {
        const img = new win.Image

        img.onload = resolve
        img.onerror = reject
        img.src = '/static/javascript-logo.png'
      })
    })
  })

  it('can correctly load image when served from file system', () => {
    cy.visit('/')
    cy.window().then((win) => {
      return new Cypress.Promise((resolve, reject) => {
        const img = new win.Image

        img.onload = resolve
        img.onerror = reject
        img.src = '/static/javascript-logo.png'
      })
    })
  })
})
