describe('zone.js', () => {
  it('can serialize XHRs without blowing out the stack', () => {
    cy
    .visit('/fixtures/zonejs.html')
    .window().then({ timeout: 30000 }, (win) => {
      return new Promise((resolve, reject) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('HEAD', '/')
        xhr.send()

        xhr.onload = () => {
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
