/* eslint-disable
    mocha/no-global-tests,
    no-undef
*/
const req = (win) => {
  return new Promise((resolve, reject) => {
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
  cy.visit('http://localhost:1515')
  .then(req) // this creates the disk cache
  .then(req)
}) // this should not hit our server
