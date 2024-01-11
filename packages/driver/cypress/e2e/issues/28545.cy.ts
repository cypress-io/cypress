// https://github.com/cypress-io/cypress/issues/28545

describe('lots of requests', () => {
  beforeEach(() => {
    cy.intercept('/lots-of-requests', (req) => {
      req.reply(
        `<html>
          <head>
            <title>Lots of Requests</title>
            <script>
              for (let i = 0; i < 50; i++) {
                fetch('/1mb?i=' + i + '&ts=' + Date.now())
              }
            </script>
            <script>
              fetch('/1mb?i=last&ts=' + Date.now())
                .then((response) => {
                  const html = '<div id="done">Done</div>'
                  document.body.insertAdjacentHTML('beforeend', html)
                })
            </script>
          </head>
          <body></body>
        </html>`,
      )
    })
  })

  describe('test isolation off', { testIsolation: false }, () => {
    it('test 1', () => {
      cy.visit('http://localhost:3500/lots-of-requests')
    })

    it('test 2', () => {
      cy.get('#done').should('contain', 'Done')
    })
  })
})
