const { _ } = Cypress

describe('uncaught errors', () => {
  beforeEach(function () {
    this.logs = []

    cy.on('log:added', (attrs, log) => {
      this.lastLog = log

      return this.logs.push(log)
    })

    return null
  })

  it('logs visit failure once', function (done) {
    const r = cy.state('runnable')

    cy.on('fail', () => {
      expect(this.logs.length).to.eq(1)

      // this runnable should not have a timer
      expect(r.timer).not.to.be.ok

      done()

      // and still not have a timer
      expect(r.timer).not.to.be.ok
    })

    // when this beforeEach hook fails
    // it will skip invoking the test
    // but run the other suite
    cy.visit('/fixtures/visit_error.html')
  })

  it('can turn off uncaught exception handling via cy', () => {
    const r = cy.state('runnable')

    cy.on('uncaught:exception', (err, runnable) => {
      try {
        expect(err.name).to.eq('ReferenceError')
        expect(err.message).to.include('foo is not defined')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])
        expect(runnable === r).to.be.true

        return false
      } catch (err2) {
        return true
      }
    })

    cy.visit('/fixtures/visit_error.html')
  })

  it('can turn off uncaught exception handling via Cypress', () => {
    const r = cy.state('runnable')

    Cypress.once('uncaught:exception', (err, runnable) => {
      expect(err.message).to.include('foo is not defined')
      expect(runnable === r).to.be.true

      return false
    })

    cy.visit('/fixtures/visit_error.html')
  })

  it('logs click error once', function (done) {
    let uncaught = false

    cy.on('uncaught:exception', () => {
      uncaught = true

      return true
    })

    cy.on('fail', (err) => {
      const { lastLog } = this

      expect(this.logs.length).to.eq(4)
      expect(uncaught).to.be.true
      expect(err.message).to.include('uncaught click error')
      expect(lastLog.get('name')).to.eq('click')
      expect(lastLog.get('error')).to.eq(err)

      done()
    })

    cy
    .visit('/fixtures/jquery.html')
    .window().then((win) => {
      return win.$('button:first').on('click', () => {
        throw new Error('uncaught click error')
      })
    }).get('button:first').click()
  })

  it('logs error on page load when new page has uncaught exception', function (done) {
    let uncaught = false

    cy.on('uncaught:exception', () => {
      uncaught = true

      return true
    })

    cy.on('fail', (err) => {
      const click = _.find(this.logs, (log) => {
        return log.get('name') === 'click'
      })

      // visit, window, contains, click, page loading, new url
      expect(this.logs.length).to.eq(6)
      expect(uncaught).to.be.true
      expect(err.message).to.include('foo is not defined')
      expect(click.get('name')).to.eq('click')

      // TODO: when there's an uncaught exception event
      // we should log this to the command log so then
      // we could update this test to always reference
      // that command log
      //
      // FIXME: in firefox this test sometimes fails
      // because the cy.click() command resolves before
      // the page navigation event occurs and therefore
      // the state('current') command is null'd out and
      // firefox does not highlight the click command in read
      // expect(click.get('error')).to.eq(err)

      done()
    })

    cy
    .visit('/fixtures/jquery.html')
    .window().then((win) => {
      return win.$('<a href=\'/fixtures/visit_error.html\'>visit</a>')
      .appendTo(win.document.body)
    })
    .contains('visit').click()

    cy.url().should('include', 'visit_error.html')
  })

  // https://github.com/cypress-io/cypress/issues/987
  it('global onerror', (done) => {
    cy.once('uncaught:exception', (err) => {
      expect(err.stack).contain('foo is not defined')
      expect(err.stack).contain('one')
      expect(err.stack).contain('two')
      expect(err.stack).contain('three')

      done()
    })

    cy.visit('/fixtures/global-error.html')
  })

  // https://github.com/cypress-io/cypress/issues/7590
  it('creates error object from error that is just a string', (done) => {
    cy.once('uncaught:exception', (err) => {
      expect(err).not.to.be.a('string')
      expect(err.message).to.include('string error')

      done()

      return false
    })

    cy
    .visit('/fixtures/jquery.html')
    .window().then((win) => {
      return win.$('button:first').on('click', () => {
        throw 'string error'
      })
    }).get('button:first').click()
  })
})
