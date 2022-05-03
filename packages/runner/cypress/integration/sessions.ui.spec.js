const helpers = require('../support/helpers')

const { runIsolatedCypress } = helpers.createCypress({ config: { experimentalSessionAndOrigin: true } })

const validateSessionsInstrumentPanel = (sessionIds = []) => {
  cy.get('.sessions-container')
  .should('contain', `Sessions (${sessionIds.length})`)
  .click()

  sessionIds.forEach((id) => {
    cy.contains('.sessions-container', id)
  })
}

describe('runner/cypress sessions.ui.spec', { viewportWidth: 1000, viewportHeight: 1000 }, () => {
  it('creates new session', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        const setupFn = cy.stub().as('runSetup')

        cy.session('blank_session', setupFn)
        cy.log('after')
      })
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')
      cy.contains('Create New Session')
      .closest('.command')
      .within(() => {
        cy.contains('runSetup')
      })
    })

    cy.percySnapshot()

    cy.get('.command-name-session').first().click('top')

    // FIXME: this should be length 2, not 3
    // the 'Clear Page' log should be nested under session group
    cy.get('.command').should('have.length', 3)
  })

  it('creates new session with validation', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        const setupFn = cy.stub().as('runSetup')
        const validateFn = cy.stub().as('runValidation')

        cy.session('blank_session', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')
      cy.contains('Create New Session')
      .closest('.command')
      .contains('runSetup')
    })

    cy.percySnapshot()

    // FIXME: this should be nested within the session command
    cy.contains('Validate Session: valid')
    .closest('.command')
    .should('not.have.class', 'command-is-open')
    .click()
    .contains('runValidation')

    cy.get('.command-name-session').first().click('top')

    // FIXME: this should be length 2, not 5
    // the validate session group should be nested under session group
    cy.get('.command').should('have.length', 5)
  })

  it('creates new session and fails validation', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        const setupFn = cy.stub().as('runSetup')
        const validateFn = cy.stub().returns(false).as('runValidation')

        cy.session('blank_session', setupFn, {
          validate: validateFn,
        })
      })
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')
      cy.contains('Create New Session')
      .closest('.command')
      .contains('runSetup')
    })

    cy.contains('Validate Session')

    // FIXME: this should be nested within the session command
    // FIXME: this should be Validate Session: invalid
    cy.contains('Validate Session')
    .closest('.command')
    .should('have.class', 'command-is-open')
    .contains('runValidation')

    cy.contains('CypressError')

    cy.percySnapshot()
  })

  // it('restores saved session', () => {
  //   runIsolatedCypress(() => {
  //     const stub = Cypress.sinon.stub().callsFake(() => {
  //       console.log(stub.callCount)
  //       if (stub.callCount === 3 || stub.callCount === 5 || stub.callCount === 6) {
  //         throw new Error('false')

  //         return false
  //       }
  //     })

  //     beforeEach(() => {
  //       cy.session('user1', () => {
  //         window.localStorage.foo = 'val'
  //       }, {
  //         validate: stub,
  //       })
  //     })

  //     it('t1', () => {
  //       expect(true).to.be.true
  //       // expect(window.localStorage.foo).to.eq('val')
  //     })

  //     it('t2', () => {
  //       expect(window.localStorage.foo).to.eq('val')
  //     })

  //     it('t3', () => {
  //       expect(window.localStorage.foo).to.eq('val')
  //     })

  //     it('t4', () => {
  //       expect(window.localStorage.foo).to.eq('val')
  //     })
  //   })

  //   cy.get('.test').each(($el) => cy.wrap($el).click())
  //   cy.get('.test').eq(0).within(() => {
  //     validateSessionsInstrumentPanel(['blank_session'])
  //   })

  //   // cy.log('validating new session was created')
  //   // cy.get('.test').eq(0).within(() => {
  //   //   cy.get('.sessions-container')
  //   //   .should('contain', 'Sessions (1)')
  //   //   .click()
  //   //   .should('contain', 'user1')

  //   //   cy.get('.command-name-session')
  //   //   .first()
  //   //   .find('i.successful')
  //   //   .siblings()
  //   //   .should('contain', '(new) user1')

  //   //   cy.get('.command-name-session')
  //   //   .last()
  //   //   .contains('user1')
  //   //   .click()

  //   //   cy.get('.command-name-assert')
  //   //   .should('have.class', 'command-state-passed')
  //   // })

  //   // cy.log('validating previous session was used')
  //   // cy.get('.test').eq(1).within(() => {
  //   //   cy.get('.sessions-container')
  //   //   .should('contain', 'Sessions (1)')
  //   //   .click()
  //   //   .should('contain', 'user1')

  //   //   cy.get('.command-name-session')
  //   //   .first()
  //   //   .find('i.pending')
  //   //   .siblings()
  //   //   .should('contain', '(saved) user1')

  //   //   cy.get('.command-name-session')
  //   //   .last()
  //   //   .contains('user1')
  //   // })

  //   // cy.log('validating session was recreated after it failed to verify')
  //   // cy.get('.test').eq(2).within(() => {
  //   //   cy.get('.sessions-container')
  //   //   .should('contain', 'Sessions (1)')
  //   //   .click()
  //   //   .should('contain', 'user1')

  //   //   cy.get('.command-name-session')
  //   //   .first()
  //   //   .find('i.bad')
  //   //   .siblings()
  //   //   .should('contain', '(recreated) user1')

  //   //   cy.get('.command-name-session')
  //   //   .last()
  //   //   .contains('user1')
  //   // })

  //   // cy.percySnapshot()
  // })

  // it('recreated session', () => {
  //   runIsolatedCypress(() => {
  //     const stub = Cypress.sinon.stub().callsFake(() => {
  //       console.log(stub.callCount)
  //       if (stub.callCount === 3 || stub.callCount === 5 || stub.callCount === 6) {
  //         throw new Error('false')

  //         return false
  //       }
  //     })

  //     beforeEach(() => {

  //     })

  //     it('t1', () => {
  //       cy.session('user1', () => {
  //         window.localStorage.foo = 'val'
  //       })

  //       cy.session('user1')
  //       cy.session('user2')
  //     })

  //     it('t2', () => {
  //       expect(window.localStorage.foo).to.eq('val')
  //     })
  //   })

  //   cy.get('.test').each(($el) => cy.wrap($el).click())
  // })

  // it('recreated session and fails validation', () => {
  //   runIsolatedCypress(() => {
  //     const stub = Cypress.sinon.stub().callsFake(() => {
  //       console.log(stub.callCount)
  //       if (stub.callCount === 3 || stub.callCount === 5 || stub.callCount === 6) {
  //         throw new Error('false')

  //         return false
  //       }
  //     })

  //     beforeEach(() => {

  //     })

  //     it('t1', () => {
  //       cy.session('user1', () => {
  //         window.localStorage.foo = 'val'
  //       })

  //       cy.session('user1')
  //       cy.session('user2')
  //     })

  //     it('t2', () => {
  //       expect(window.localStorage.foo).to.eq('val')
  //     })
  //   })

  //   cy.get('.test').each(($el) => cy.wrap($el).click())
  // })

  it('multiple sessions in a test', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        cy.session('user1', () => {
          window.localStorage.foo = 'val'
        })

        cy.session('user2', () => {
          window.localStorage.foo = 'val'
          window.localStorage.bar = 'val'
        })
      })
    })

    validateSessionsInstrumentPanel(['user1', 'user2'])
    cy.percySnapshot()
  })
})
