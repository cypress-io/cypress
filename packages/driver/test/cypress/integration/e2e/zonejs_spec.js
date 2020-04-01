// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// https://github.com/cypress-io/cypress/issues/741
describe('zone.js', () => {
  return it('can serialize XHRs without blowing out the stack', () => {
    return cy
    .visit('/fixtures/zonejs.html')
    .window().then({ timeout: 30000 }, (win) => {
      return new Promise((resolve, reject) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('HEAD', '/')
        xhr.send()

        xhr.onload = function () {
          try {
            Cypress.Log.toSerializedJSON(xhr)

            return resolve()
          } catch (err) {
            return reject(err)
          }
        }
      })
    })
  })
})
