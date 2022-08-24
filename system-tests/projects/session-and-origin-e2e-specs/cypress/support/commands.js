Cypress.Commands.add('login', (sessionId, cacheAcrossSpecs = false) => {
  const specSessionDetails = {
    cookies: [
      { name: 'token', value: '1', domain: 'localhost', path: '/cypress/fixtures', httpOnly: false, secure: false },
    ],
    localStorage: [
      { origin: 'http://localhost:4455', value: { animal: 'tiger', persist: 'true' } },
    ],
    sessionStorage: [
      { origin: 'http://localhost:4455', value: { food: 'zebra' } },
    ],
  }

  const globalSessionDetails = {
    cookies: [
      { name: 'token', value: '2', domain: 'localhost', path: '/cypress/fixtures', httpOnly: false, secure: false },
    ],
    localStorage: [
      { origin: 'http://localhost:4455', value: { animal: 'bear' } },
    ],
    sessionStorage: [
      { origin: 'http://localhost:4455', value: { food: 'salmon' } },
    ],
  }

  cy.session(sessionId, () => {
    if (cacheAcrossSpecs) {
      cy.window().then((win) => {
        win.localStorage.setItem('persist', true)
      })
    }

    cy.visit('/cypress/fixtures/loginPage.html')
    cy.get('button').click()
    cy.contains('Home Page')
  }, {
    validate: () => {
      cy.visit('/cypress/fixtures/home.html')
      cy.contains('Home Page')

      cy.then(async () => {
        const result = await Cypress.session.getCurrentSessionData()

        // console.log(result)
        const expectedResult = cacheAcrossSpecs ? globalSessionDetails : specSessionDetails

        // console.log(expectedResult)

        expect(result.cookies).deep.members(expectedResult.cookies)
        expect(result.localStorage).deep.members(expectedResult.localStorage)
        expect(result.sessionStorage).deep.members(expectedResult.sessionStorage)
      })
    },
    cacheAcrossSpecs,
  })
})
