import Timeouts from '@packages/driver/src/cy/timeouts'

describe('driver/src/cy/timeouts', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  it('creates timeout and clearTimeout props', () => {
    const state = cy.state('window')
    const timeouts = Timeouts.create(state)

    expect(timeouts).to.have.property('timeout')
    expect(timeouts).to.have.property('clearTimeout')
  })

  context('timeout', () => {
    it('throws when no runnable', () => {
      const state = () => { }
      const timeouts = Timeouts.create(state)

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
      const state = () => { }
      const timeouts = Timeouts.create(state)

      const fn = () => {
        return timeouts.clearTimeout()
      }

      expect(fn)
      .to.throw('Cypress cannot execute commands outside a running test.')
      .with.property('docsUrl', 'https://on.cypress.io/cannot-execute-commands-outside-test')
    })
  })
})
