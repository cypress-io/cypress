// https://github.com/cypress-io/cypress/pull/32925
describe('intercept sync request', () => {
  it('completes all the way with route handler', () => {
    cy.intercept('/app', {
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sync Request</title>
        </head>
        <body>
        <div>
          <button id="sync-request-button">Test Sync Request</button>
          <div id="counter"></div>
        </div>
        <script>
          const button = document.querySelector('#sync-request-button')
          button.addEventListener('click', () => {
            let xhr = new window.XMLHttpRequest()
            xhr.open('GET', '/', false)
            xhr.onload = () => console.log(xhr.status)
            xhr.send()
          })
          let count = 0
          setInterval(() => {
            document.querySelector('#counter').innerHTML = count
            count++
          }, 100)
        </script>
        </body>
        </html>
      `,
    })

    cy.intercept('/', () => {})
    cy.visit('/app')
    cy.get('#sync-request-button').click()
    cy.wrap(0).should('eq', 0)
  })
})
