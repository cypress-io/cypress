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

const validateNewSessionGroup = () => {
  cy.contains('Create New Session')
  .closest('.command')
  .contains('runSetup')

  cy.contains('Create New Session')
  .closest('.command')
  .find('.command-name-Clear-Page')
  .should('have.length', 2)
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

      validateNewSessionGroup()
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

      validateNewSessionGroup()
    })

    // FIXME: this should be nested within the session command
    // FIXME: this should be Validate Session: invalid
    cy.contains('Validate Session')
    .closest('.command')
    .should('have.class', 'command-is-open')
    .contains('runValidation')

    cy.contains('CypressError')

    cy.percySnapshot()
  })

  it('restores saved session', () => {
    runIsolatedCypress(() => {
      let setupFn
      let validateFn

      before(() => {
        setupFn = cy.stub().as('runSetup')
        validateFn = cy.stub().as('runValidation')
      })

      it('t1', () => {
        cy.session('user1', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })

      it('t2', () => {
        cy.session('user1', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])
      validateNewSessionGroup()
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.get('i.pending').siblings().should('contain', '(saved) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: valid')
        .closest('.command')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align
        .should('have.class', 'command-is-open')
        .contains('runValidation')
      })

      cy.get('.command-name-session').first().click('top')

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreates session', () => {
    runIsolatedCypress(() => {
      let setupFn
      let validateFn

      before(() => {
        setupFn = cy.stub().as('runSetup')
        validateFn = cy.stub().callsFake(() => {
          if (validateFn.callCount === 2) {
            return false
          }
        }).as('runValidation')
      })

      it('t1', () => {
        cy.session('user1', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })

      it('t2', () => {
        cy.session('user1', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.contains('Create New Session')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.get('i.bad').siblings().should('contain', '(recreated) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: invalid')

        cy.contains('Create New Session')
        .closest('.command')
        .should('have.class', 'command-is-open')

        cy.contains('Validate Session: valid')
        .closest('.command')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align
        .should('have.class', 'command-is-open')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 1)

      cy.get('.command-name-session').first().click('top')

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreated session and fails validation', () => {
    runIsolatedCypress(() => {
      let setupFn
      let validateFn

      before(() => {
        setupFn = cy.stub().as('runSetup')
        validateFn = cy.stub().callsFake(() => {
          if (validateFn.callCount >= 2) {
            return false
          }
        }).as('runValidation')
      })

      it('t1', () => {
        cy.session('user1', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })

      it('t2', () => {
        cy.session('user1', setupFn, {
          validate: validateFn,
        })

        cy.log('after')
      })
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.contains('Create New Session')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.get('i.bad').siblings().should('contain', '(recreated) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: invalid')

        // FIXME: this validation group should say 'Validate Session: valid'
        cy.contains('Validate Session')
        .closest('.command')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        //' should be 'not.have.class' to align
        .should('have.class', 'command-is-open')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.contains('Create New Session')
      .closest('.command')
      // FIXME: this 'Create New Session' group's collapsed behavior
      // does not align with behavior observed in other 'Create New Session'
      // groups should be 'not.have.class' to align
      .should('not.have.class', 'command-is-open')
      .click()

      validateNewSessionGroup()

      cy.get('.runnable-err').should('have.length', 2)
    })
  })

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
