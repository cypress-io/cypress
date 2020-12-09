/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('images', () => {
  it('can correctly load images when served from http server', () => {
    return cy
    .visit('http://localhost:3636')
    .window().then((win) => {
      return new Cypress.Promise((resolve, reject) => {
        const img = new win.Image

        img.onload = resolve
        img.onerror = reject
        img.src = '/static/javascript-logo.png'
      })
    })
  })

  it('can correctly load image when served from file system', () => {
    return cy
    .visit('/')
    .window().then((win) => {
      return new Cypress.Promise((resolve, reject) => {
        const img = new win.Image

        img.onload = resolve
        img.onerror = reject
        img.src = '/static/javascript-logo.png'
      })
    })
  })
})
