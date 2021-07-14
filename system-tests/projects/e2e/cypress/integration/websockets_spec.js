/* eslint-disable no-undef */
const shouldCloseUrlWithCode = (win, url, code) => {
  return new Promise((resolve, reject) => {
    const ws = new win.WebSocket(url)

    // ws.onerror = (err) ->
    // debugger

    ws.onclose = function (evt) {
      if (evt.code === code) {
        return resolve()
      }

      return reject(new Error(`websocket connection should have been closed with code ${code} for url: ${url} but was instead closed with code: ${evt.code}`))
    }

    ws.onopen = (evt) => {
      return reject(new Error(`websocket connection should not have opened for url: ${url}`))
    }
  })
}

describe('websockets', () => {
  it('does not crash', () => {
    cy.visit('http://localhost:3038/foo')
    cy.log('should not crash on ECONNRESET websocket upgrade')
    cy.window().then((win) => {
      // see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      return Cypress.Promise.all([
        shouldCloseUrlWithCode(win, 'ws://localhost:3038/websocket', 1006),
        shouldCloseUrlWithCode(win, 'wss://localhost:3040/websocket', 1006),
      ])
    })

    cy.log('should be able to send websocket messages')

    cy.window()
    .then((win) => {
      return new Promise((resolve, reject) => {
        const ws = new win.WebSocket('ws://localhost:3039/')

        ws.onmessage = (evt) => {
          return resolve(evt.data)
        }

        ws.onerror = () => {
          return reject(new Error('connection failed, check console for error'))
        }

        ws.onopen = () => {
          return ws.send('foo')
        }
      })
    }).should('eq', 'foobar')
  })
})
