// https://github.com/cypress-io/cypress/issues/741
describe('zone.js', () => {
  it('can serialize XHRs without blowing out the stack', () => {
    cy
    .visit('/fixtures/zonejs.html')
    .window().then({ timeout: 30000 }, (win) => {
      return new Promise<void>((resolve, reject) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('HEAD', '/')
        xhr.send()

        xhr.onload = () => {
          try {
            // @ts-expect-error - `Cypress.Log` is the internal LogUtils namespace at runtime, but the public types only declare it as a log instance
            Cypress.Log.toSerializedJSON(xhr)

            resolve()
          } catch (err) {
            reject(err)
          }
        }
      })
    })
  })
})
