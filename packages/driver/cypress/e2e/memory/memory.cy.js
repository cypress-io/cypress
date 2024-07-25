// describe('memory spec', { browser: { family: 'chromium' } }, () => {
//   for (let index = 0; index < 300; index++) {
//     it(`test ${index + 1} passes`, () => {
//       cy.visit('http://localhost:3500/memory')
//     })
//   }
// })

// failed with the following error:
// Response stream timed out for request: 45541.17727
// CdpLagTimeoutError: Response stream timed out for request: 45541.17727
// describe('memory spec', { browser: { family: 'chromium' } }, () => {
//   for (let index = 0; index < 300; index++) {
//     it(`test ${index + 1} passes`, () => {
//       cy.visit('https://www.msn.com/')
//       cy.wait(1000)
//     })
//   }
// })

// fails with OOM when recording
// describe('memory spec', { browser: { family: 'chromium' } }, () => {
//   for (let index = 0; index < 200; index++) {
//     it(`test ${index + 1} passes`, () => {
//       cy.visit('https://www.google.com/maps')
//       cy.wait(1000)
//     })
//   }
// })

describe('memory spec', { browser: { family: 'chromium' } }, () => {
  Cypress._.times(100, (index) => {
    it(`test ${index + 1} passes`, () => {
      cy.visit('https://www.amazon.com/')
      cy.wait(1000)
    })
  })
})
