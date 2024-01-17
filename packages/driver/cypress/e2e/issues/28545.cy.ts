// https://github.com/cypress-io/cypress/issues/28545

const obj = {}

for (let i = 0; i < 1000; i++) {
  obj[i] = 'x'.repeat(1000)
}

const largeJson = (i) => {
  obj[1000] = i

  return JSON.stringify(obj)
}

describe('lots of requests', () => {
  beforeEach(() => {
    cy.intercept('GET', '/largeJson*', (req) => {
      req.reply({
        statusCode: 200,
        body: largeJson(req.query.i),
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
                fetch('/largeJson?test=${test}&i=${i}&j=' + j).catch(() => {})
              }
            </script>
          </head>
          <body>
            <a href="http://localhost:3500/lots-of-requests?test=${test}&i=2">Visit</a>
            <script>
              fetch('https://jsonplaceholder.cypress.io/todos')
                .then(function (response) {
                  return response.json()
                }).then(function (json) {
                  renderTodos(json)
                }).catch(() => {})
  
              function renderTodos(todos) {
                const html = '<table id="todos">' + todos.map(function (todo) {
                  return '<tr>' + Object.values(todo).map(function (value) {
                    return '<td>' + value + '</td>'
                  }).join('') + '</tr>'
                }) + '</table>'
  
                document.body.insertAdjacentHTML('beforeend', html)
              }
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
    // splitting the test into two parts causes the test to run slow
      it('test 1', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=1&i=1')
      })

      it('test 2', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=2&i=1')
        cy.get('table tr').should('have.length', 200, { timeout: 10000 })
      })
    })

    describe('test isolation off', { testIsolation: false }, () => {
    // splitting the test into two parts causes the test to run slow
      it('test 3', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=3&i=1')
      })

      it('test 4', () => {
        cy.get('table tr').should('have.length', 200, { timeout: 10000 })
      })
    })

    describe('test isolation back on', { testIsolation: true }, () => {
    // splitting the test into two parts causes the test to run slow
      it('test 5', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=5&i=1')
      })

      it('test 6', () => {
        cy.visit('http://localhost:3500/lots-of-requests?test=6&i=1')
        cy.get('table tr').should('have.length', 200, { timeout: 10000 })
      })
    })
  })

  describe('multiple visits in one test', { testIsolation: true }, () => {
    it('test 7', () => {
      cy.visit('http://localhost:3500/lots-of-requests?test=7&i=1')
      cy.visit('http://localhost:3500/lots-of-requests?test=7&i=2')
      cy.get('table tr').should('have.length', 200, { timeout: 10000 })
    })
  })

  describe('navigation in one test', { testIsolation: true }, () => {
    // need to remove preRequests in onRequestFailed since we receive all the
    // cdp events for the visit right away but not all the proxied requests

    it('test 8', () => {
      cy.visit('http://localhost:3500/lots-of-requests?test=8&i=1')
      cy.get('a').click()
      cy.get('table tr').should('have.length', 200, { timeout: 10000 })
    })
  })

  // describe('network error', { testIsolation: true }, () => {
  //   // beforeEach(() => {
  //   //   cy.intercept('GET', '/largeJson?test=9&i=*&j=5', { forceNetworkError: true })
  //   // })

  //   it('test 9', () => {
  //     cy.visit('http://localhost:3500/lots-of-requests?test=9&i=1')
  //     cy.wait(new Array(50).fill('@largeJson'))
  //     cy.get('table tr').should('have.length', 200, { timeout: 10000 })
  //   })
  // })
})
