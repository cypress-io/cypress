/* eslint-disable
    mocha/no-global-tests,
    no-undef,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const req = (win) => {
  return new Promise((resolve, reject) => {
    const rand = Math.random()

    const xhr = new win.XMLHttpRequest()

    xhr.open('GET', 'http://localhost:1515/cached/')
    xhr.onload = () => {
      return resolve(win)
    }

    xhr.onerror = reject

    return xhr.send()
  })
}

it('makes cached request', () => {
  return cy
  .visit('http://localhost:1515')
  .then(req) // this creates the disk cache
  .then(req)
}) // this should not hit our server
