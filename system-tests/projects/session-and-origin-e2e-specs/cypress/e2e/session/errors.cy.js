/**
 * Used in cy-in-cy tests in @packages/app.
 */
before(async () => {
  Cypress.state('activeSessions', {})
  await Cypress.session.clearAllSavedSessions()
})

// unique session id for the test
let sessionId
// testData set to verify recreated test error in @packages/app
let testData
// the number of times validate has executed for a test
let count = 0

beforeEach(() => {
  count = 0
  sessionId = `session_${Cypress._.uniqueId()}`
  testData = Cypress.state('specWindow').parent.CYPRESS_TEST_DATA

  // uncomment to debug tests:

  // 1) create session:
  // testData = undefined

  // 2) Recreate session & recover:
  // testData = {
  //   restoreSessionWithValidationFailure: true,
  //   successfullyRecreatedSession: true,
  // }

  // 3) recreate session & fail to recover:
  // testData = {
  //   restoreSessionWithValidationFailure: true,
  //   successfullyRecreatedSession: false,
  // }
})

function setup () {
  cy.get('div')
}

it('setup - has failing command', () => {
  function setup () {
    if (testData && (
    // create session for first command run
      count === 0
        // recreated session is successful
        || (testData?.successfullyRecreatedSession)
    )) {
      return cy.get('div')
    }

    cy.get('does_not_exist', { timeout: 1 })
  }

  function validate () {
    count += 1
    if (testData?.restoreSessionWithValidationFailure
      && (
        // create session for first command run
        count === 1
        // recreated session is successful
        || (testData?.successfullyRecreatedSession && count === 3)
      )
    ) {
      return
    }

    cy.wrap(false)
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})

it('validate - has failing Cypress command', function () {
  function validate () {
    count += 1

    if (testData?.restoreSessionWithValidationFailure
      && (
        // create session for first command run
        count === 1
        // recreated session is successful
        || (testData?.successfullyRecreatedSession && count === 3)
      )
    ) {
      return cy.get('div', { timeout: 1 })
    }

    cy.wrap(null).click()

    cy.get('does_not_exist', { timeout: 1 })
    // cy.get('does_not_exist_2', { timeout: 1 })
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})

it('validate - command yields false', () => {
  function validate () {
    count += 1

    if (testData?.restoreSessionWithValidationFailure
      && (
        // create session for first command run
        count === 1
        // recreated session is successful
        || (testData?.successfullyRecreatedSession && count === 3)
      )
    ) {
      return cy.then(() => {
        return true
      })
    }

    cy.then(() => {
      return false
    })
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})

it('validate - has multiple commands and yields false', () => {
  function validate () {
    count += 1
    cy.log('filler log')

    if (testData?.restoreSessionWithValidationFailure) {
      if (
        // create session for first command run
        count === 1
        // recreated session is successful
        || (testData?.successfullyRecreatedSession && count === 3)
      ) {
        return cy.then(() => {
          return cy.wrap(true)
        })
      }
    }

    cy.then(() => {
      return cy.wrap(false)
    })
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})

it('validate - rejects with false', () => {
  function validate () {
    count += 1

    return new Promise(async (resolve, reject) => {
      if (testData?.restoreSessionWithValidationFailure) {
        if (
          // create session for first command run
          count === 1
          // recreated session is successful
          || (testData?.successfullyRecreatedSession && count === 3)
        ) {
          return resolve()
        }
      }

      return reject(false)
    })
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})

it('validate - promise resolves false', () => {
  function validate () {
    count += 1

    return new Promise((resolve, reject) => {
      if (testData?.restoreSessionWithValidationFailure) {
        if (
          // create session for first command run
          count === 1
          // recreated session is successful
          || (testData?.successfullyRecreatedSession && count === 3)
        ) {
          return resolve()
        }
      }

      return resolve(false)
    })
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})

it('validate - throws an error', () => {
  function validate () {
    count += 1

    cy.get('div')
    .within(() => {
      Cypress.log({
        name: 'do something before error is thrown',
        type: 'system',
        event: true,
        state: 'passed',
      })

      if (testData?.restoreSessionWithValidationFailure) {
        if (
          // create session for first command run
          count === 1
          // recreated session is successful
          || (testData?.successfullyRecreatedSession && count === 3)
        ) {
          return
        }
      }

      throw new Error('Something went wrong!')
    })
  }

  cy.session(sessionId, setup, { validate })

  if (testData) {
    cy.session(sessionId, setup, { validate })
  }
})
