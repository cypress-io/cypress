const {
  Promise,
} = Cypress

let previousTestWasCanceled = false
let calledAfterDoneEarly = false

describe('canceling command queues', () => {
  it('Cypress.stop()', (done) => {
    cy.stub(Cypress.runner, 'stop')

    let calledAfterStop = false

    cy.once('stop', () => {
      expect(cy.state('promise').isCancelled()).to.be.true

      return Promise
      .delay(50)
      .then(() => {
        expect(calledAfterStop).to.be.false

        done()
      })
    })

    cy.wrap(null).then(() => {
      Cypress.stop()

      return null
    }).then(() => {
      // should not be called
      return calledAfterStop = true
    })
  })

  it('done early', function (done) {
    cy.once('command:start', function (cmd) {
      const {
        cancel,
      } = cy.state('promise')

      cy.state('promise').cancel = () => {
        previousTestWasCanceled = true

        return cancel.apply(this, arguments)
      }

      done()
    })

    cy.wrap(null).then(() => calledAfterDoneEarly = true)
  })

  it('verifies the previous test worked', () => {
    expect(previousTestWasCanceled).to.be.true

    expect(calledAfterDoneEarly).to.be.false
  })

  it('command failure', (done) => {
    // make sure there are no unhandled rejections
    Promise.onPossiblyUnhandledRejection(done)

    let calledAfterFailure = false

    cy.on('fail', () => {
      return Promise
      .delay(50)
      .then(() => {
        expect(cy.isStopped()).to.be.true // make sure we ran our cleanup routine
        expect(calledAfterFailure).to.be.false

        done()
      })
    })

    cy.wrap(null).then(() => {
      throw new Error('foo')
    }).then(() => calledAfterFailure = true)
  })
})
