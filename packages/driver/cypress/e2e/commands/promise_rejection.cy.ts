describe('promise rejection reasons', () => {
  for (const reason of [null, undefined]) {
    it(`reports a promise rejected with ${reason}`, (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('CypressError')
        expect(err.message).to.eq(`A command failed with \`${reason}\`, but no error was provided.\n\nThrow or reject with an Error object to provide a useful message and stack trace.`)
        expect(err.stack).to.include('promise_rejection.cy.ts')
        done()
      })

      if (reason === null) {
        cy.wrap(null).then(Cypress.Promise.reject)
      } else {
        cy.then(() => Cypress.Promise.reject(undefined))
      }
    })
  }

  for (const reason of [null, undefined]) {
    it(`reports a thrown ${reason} from a command callback`, (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('CypressError')
        expect(err.message).to.eq(`A command failed with \`${reason}\`, but no error was provided.\n\nThrow or reject with an Error object to provide a useful message and stack trace.`)
        expect(err.stack).to.include('promise_rejection.cy.ts')
        done()
      })

      cy.then(() => {
        throw reason
      })
    })
  }

  it('preserves an existing Error instance', (done) => {
    const original = new Error('original rejection sentinel')

    cy.on('fail', (err) => {
      expect(err).to.eq(original)
      expect(err.message).to.eq('original rejection sentinel')
      done()
    })

    cy.then(() => Cypress.Promise.reject(original))
  })

  it('preserves the existing string rejection message', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.eq('string rejection sentinel')
      done()
    })

    cy.then(() => Cypress.Promise.reject('string rejection sentinel'))
  })

  it('continues with a fresh command queue in the next test', () => {
    cy.wrap('following test').should('eq', 'following test')
  })
})
