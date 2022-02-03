/* eslint-disable no-undef */
describe('block hosts', () => {
  it('forces blocked hosts to return 503', () => {
    cy.visit('http://localhost:3232')

    cy.window().then((win) => {
      return new Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', 'http://localhost:3232/req')
        xhr.setRequestHeader('Content-Type', 'text/plain')
        xhr.send()
        xhr.onload = () => resolve(xhr)
      })
    }).its('status').should('eq', 200)

    cy.window().then((win) => {
      return new Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', 'http://localhost:3131/req')
        xhr.setRequestHeader('Content-Type', 'text/plain')
        xhr.send()

        // cross origin requests which return 503
        // result in a zero status code
        xhr.onerror = () => resolve(xhr)
      })
    }).its('status').should('eq', 0)
  })
})
