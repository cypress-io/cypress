describe('remote driver: network handling in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  it('loads transfer-encoding: chunked redirects that end on another origin', () => {
    cy.intercept('*')
    const originOne = 'http://foobar.com:3500'
    const originTwo = 'http://foobar.com:3501'

    const url4 = `${originTwo}/fixtures/generic.html`
    const url3 = `${originTwo}/redirect?href=${encodeURIComponent(url4)}`
    const url2 = `${originOne}/redirect?chunked=1&href=${encodeURIComponent(url3)}`
    const url1 = `${originOne}/redirect?chunked=1&href=${encodeURIComponent(url2)}`

    cy.visit(`${originOne}/fixtures/empty.html`)
    cy.visit(url1)
    cy.location('href').should('eq', url4)
  })

  it('skips a route handler for a synchronous XHR from a cross-origin AUT', () => {
    cy.intercept('http://www.foobar.com:3500/', {
      body: `
        <!DOCTYPE html>
        <html>
        <body>
          <div id="sync_response"></div>
          <div id="async_response"></div>
          <script>
            const xhr = new window.XMLHttpRequest()
            xhr.open('GET', '/fixtures/valid.json', false)
            xhr.send()
            document.querySelector('#sync_response').innerHTML = JSON.stringify(JSON.parse(xhr.responseText))

            const xhr2 = new window.XMLHttpRequest()
            xhr2.open('GET', '/async', true)
            xhr2.onload = () => {
              document.querySelector('#async_response').innerHTML = xhr2.responseText
            }
            xhr2.send()
          </script>
        </body>
        </html>
      `,
    })

    cy.intercept('http://www.foobar.com:3500/fixtures/valid.json', (req) => {
      req.reply({ body: '' })
    })

    cy.intercept('http://www.foobar.com:3500/async', (req) => {
      req.reply({ body: 'async' })
    }).as('async')

    cy.visit('http://www.foobar.com:3500/')
    cy.get('#sync_response').should('contain', '{"foo":1,"bar":{"baz":"cypress"}}')
    cy.get('#async_response').should('contain', 'async')
    cy.wait('@async')
  })
})
