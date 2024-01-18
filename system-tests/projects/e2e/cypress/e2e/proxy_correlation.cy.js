// https://github.com/cypress-io/cypress/issues/28545

const json = {}

for (let i = 0; i < 1000; i++) {
  json[i] = 'x'.repeat(1000)
}

describe('lots of requests', () => {
  beforeEach(() => {
    cy.intercept('GET', '/large-json*', (req) => {
      req.reply({
        statusCode: 200,
        body: JSON.stringify(json),
      })
    }).as('largeJson')

    cy.intercept('/lots-of-requests*', (req) => {
      const test = req.query.test
      const i = req.query.i

      req.reply(
        `<html>
          <head>
            <title>Lots of Requests</title>
            <script>
              for (let j = 0; j < 50; j++) {
                fetch('/large-json?test=${test}&i=${i}&j=' + j).catch(() => {})
              }
            </script>
          </head>
          <body>
            <a href="http://localhost:3500/lots-of-requests?test=${test}&i=2">Visit</a>
            <script>
              fetch('/large-json?test=${test}&i=${i}&last=1')
              .then((response) => {
                const html = '<div id="done">Done</div>'
                document.body.insertAdjacentHTML('beforeend', html)
              })
              .catch(() => {})
            </script>
          </body>
        </html>`,
        {
          'content-type': 'text/html',
        },
      )
    })
  })

  describe('test isolation', () => {
    describe('test isolation on', { testIsolation: true }, () => {
      it('test 1', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=1&i=1')
      })

      it('test 2', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=2&i=1')
        cy.get('#done').should('contain', 'Done')
      })
    })

    describe('test isolation off', { testIsolation: false }, () => {
      it('test 3', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=3&i=1')
      })

      it('test 4', () => {
        cy.get('#done').should('contain', 'Done')
      })
    })

    describe('test isolation back on', { testIsolation: true }, () => {
      it('test 5', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=5&i=1')
      })

      it('test 6', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=6&i=1')
        cy.get('#done').should('contain', 'Done')
      })
    })
  })

  describe('multiple visits in one test', { testIsolation: true }, () => {
    it('test 7', () => {
      cy.visit('http://localhost:3500/lots-of-requests?test=7&i=1')
      cy.visit('http://localhost:3500/lots-of-requests?test=7&i=2')
      cy.get('#done').should('contain', 'Done')
    })
  })

  describe('navigation in one test', { testIsolation: true }, () => {
    it('test 8', () => {
      cy.visit('http://localhost:3500/lots-of-requests?test=8&i=1')
      cy.get('a').click()
      cy.get('#done').should('contain', 'Done')
    })
  })

  describe('network error', { testIsolation: true }, () => {
    beforeEach(() => {
      cy.intercept('GET', '/large-json?test=9&i=1&j=8', { forceNetworkError: true })
    })

    it('test 9', () => {
      cy.visit('http://localhost:3500/lots-of-requests?test=9&i=1')
      cy.get('#done').should('contain', 'Done')
    })
  })
})
