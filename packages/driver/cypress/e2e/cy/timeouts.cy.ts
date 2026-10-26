import { create } from '@packages/driver/src/cy/timeouts'
import type { StateFunc } from '@packages/driver/src/cypress/state'

describe('driver/src/cy/timeouts', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  it('creates timeout and clearTimeout props', () => {
    const state = cy.state('window')
    const timeouts = create(state)

    expect(timeouts).to.have.property('timeout')
    expect(timeouts).to.have.property('clearTimeout')
  })

  context('timeout', () => {
    it('throws when no runnable', () => {
      const state = (() => { }) as StateFunc
      const timeouts = create(state)

      const fn = () => {
        return timeouts.timeout(0)
      }

      expect(fn)
      .to.throw('Cypress cannot execute commands outside a running test.')
      .with.property('docsUrl', 'https://on.cypress.io/cannot-execute-commands-outside-test')
    })
  })

  context('clearTimeout', () => {
    it('throws when no runnable', () => {
      const state = (() => { }) as StateFunc
      const timeouts = create(state)

      const fn = () => {
        return timeouts.clearTimeout()
      }

      expect(fn)
      .to.throw('Cypress cannot execute commands outside a running test.')
      .with.property('docsUrl', 'https://on.cypress.io/cannot-execute-commands-outside-test')
    })
  })
})

describe('query timeout error wording', { retries: 0 }, () => {
  it('omits retry wording for a zero default timeout', { defaultCommandTimeout: 0 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.eq('expected 1 to equal 2')
      done()

      return false
    })

    cy.wrap({ value: 1 }).its('value').should('equal', 2)
  })

  it('omits retry wording for an explicit zero timeout', { defaultCommandTimeout: 4000 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.eq('expected 1 to equal 2')
      done()

      return false
    })

    cy.wrap({ value: 1 }).its('value', { timeout: 0 }).should('equal', 2)
  })

  it('keeps retry wording for a positive timeout', { defaultCommandTimeout: 4000 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.eq('Timed out retrying after 100ms: expected 1 to equal 2')
      done()

      return false
    })

    cy.wrap({ value: 1 }).its('value', { timeout: 100 }).should('equal', 2)
  })
})
