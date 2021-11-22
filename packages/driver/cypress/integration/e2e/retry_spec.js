const { assertLogLength } = require('../../support/utils')

const timesFlaked = 25

describe('redirection', () => {
  before((done) => {
    cy
    .visit('/fixtures/empty.html')
    // .visit('/fixtures/meta-redirect.html')
    //.window()
    .then((win) => {
      const xhr = new win.XMLHttpRequest

      xhr.open('GET', '/flakyRoute?id=1&reset=true')
      xhr.send()
      xhr.onerror = () => {
        console.log('reset error!!!')
      }

      xhr.onload = () => {
        console.log(`reset success! ${xhr.response}`)
        done()
      }
    })
  })

  beforeEach(function () {
    this.logs = []

    cy.on('log:added', (attrs, log) => {
      return this.logs.push(log)
    })

    return null
  })

  context('xhr', () => {
    it('flakes out', (done) => {
      // cy.intercept('/timeout?ms=100', { times: 3 }, { forceNetworkError: true })
      // cy.intercept('/timeout?ms=100', { body: [{ id: 1, name: 'foo' }] })
      cy
      .visit('/fixtures/empty.html')
      // .visit('/fixtures/meta-redirect.html')
      //.window()
      .then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', `/flakyRoute?id=1&flake=${timesFlaked}`)
        xhr.send()
        xhr.onerror = () => {
          console.log('flake error!!!')

          done()
        }

        xhr.onload = () => {
          console.log(`flake success! ${xhr.response}`)

          done()
        }
      })
    })

    it('succeeds', (done) => {
      // cy.intercept('/timeout?ms=100', { times: 8 }, { forceNetworkError: true })
      // cy.intercept('/timeout?ms=100', { body: [{ id: 1, name: 'foo' }] })
      cy
      .visit('/fixtures/empty.html')
      // .visit('/fixtures/meta-redirect.html')
      //.window()
      .then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', `/flakyRoute?id=1&flake=${timesFlaked}`)
        xhr.send()
        xhr.onerror = () => {
          console.log('send error!!!')
          expect
          done()
        }

        xhr.onload = () => {
          expect(xhr.response).to.eq(`<html><body>flakyRoute Call: ${timesFlaked + 1}</body></html>`)
          console.log(`success! ${xhr.response}`)
          done()
        }
      })

    // cy.wait(3000).then(() => {
    //   done()
    // })
    })

    it('binds to the new page after a timeout', () => {
      cy
      .visit('/fixtures/meta-redirect-timeout-retry.html')
      .contains('flakyRoute')
      .then(function () {
        // visit, contains, page load, new url
        const receivedLogs = this.logs.reduce((prev, curr, index) => `${prev}, ${index}: ${curr.get('name')}`, '')

        assertLogLength(this.logs, 4, `received more logs than expected: ${receivedLogs}`)

        expect(this.logs[0].get('name')).to.eq('visit')
        expect(this.logs[1].get('name')).to.eq('contains')
        expect(this.logs[2].get('name')).to.eq('page load')
        expect(this.logs[3].get('name')).to.eq('new url')
      })
    })
  })
})
