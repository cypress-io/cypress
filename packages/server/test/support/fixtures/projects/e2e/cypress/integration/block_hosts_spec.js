/* eslint-disable
    brace-style,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('block hosts', () => {
  it('forces blocked hosts to return 503', () => {
    return cy
    .visit('http://localhost:3232')

    .window().then((win) => {
      return new Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', 'http://localhost:3232/req')
        xhr.setRequestHeader('Content-Type', 'text/plain')
        xhr.send()
        xhr.onload = () => {
          return resolve(xhr)
        }
      })
    }).its('status').should('eq', 200)

    .window().then((win) => {
      return new Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', 'http://localhost:3131/req')
        xhr.setRequestHeader('Content-Type', 'text/plain')
        xhr.send()

        xhr.onerror = () => // cross origin requests which return 503
        // result in a zero status code
        {
          return resolve(xhr)
        }
      })
    }).its('status').should('eq', 0)
  })
})
