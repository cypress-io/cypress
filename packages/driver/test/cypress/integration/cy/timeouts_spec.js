import Timeouts from '../../../../src/cy/timeouts.coffee'

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
})
