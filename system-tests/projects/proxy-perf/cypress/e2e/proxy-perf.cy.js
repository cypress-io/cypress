const { _ } = Cypress

const delayFetchTimes = (win, domain, times, delayFn) => {
  return _.times(times, (n) => {
    n++

    const delay = delayFn(n)

    const now = Date.now()
    const test = Cypress.currentTest.title

    return win.fetch(`https://${domain}:3501/delay?&ms=${delay}`)
    .then(() => {
      const duration = Date.now() - now

      const excess = duration - delay

      console.log('fetch took', { test, delay, duration, excess })
    })
    .catch((err) => {
      // debugger
    })
  })
}

describe('proxy perf', () => {
  beforeEach(() => {
    cy.visit('https://localhost:3500')
  })

  afterEach(() => {
    // const test = Cypress.currentTest.title
    // const ms = 500

    // _.times(10, (n) => {
    //   cy.then(() => {
    //     const now = Date.now()

    //     cy.request(`https://dev.foo.com:3501/dev?ms=${ms}`)
    //     .then((r) => {
    //       // debugger
    //       const duration = Date.now() - now
    //       const excess = duration - ms

    //       console.log('cy.request took', { test, duration, ms, excess })

    //       cy.log(`duration: ${duration}`)
    //     })
    //   })
    // })

    // cy.then(() => {
    //   throw new Error('fail whale')
    // })
  })

  _.times(1, (n) => {
    n++

    it(`t${n}`, () => {
      cy.window().then({ timeout: 1e9 }, (win) => {
        const fetches = delayFetchTimes(win, 'dev.foo.com', 10, (n) => {
          return 500
        })

        return Promise.all(fetches)
        .then(() => {
          delayFetchTimes(win, 'dev.foo.com', 2, (n) => {
            return 2000
          })

          // end the test early, leave the network requests open
          return null
        })
      })
    })
  })
})
