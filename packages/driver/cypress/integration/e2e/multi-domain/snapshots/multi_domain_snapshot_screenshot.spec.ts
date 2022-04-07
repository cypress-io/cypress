import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('cross-origin snapshot screenshot', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.viewport(600, 200)
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="screenshots-link"]').click()
  })

  it('.screenshot()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('screenshot', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('screenshot')

        expect(consoleProps).to.have.property('blackout')
        expect(consoleProps).to.have.property('capture').that.equals('fullPage')
        expect(consoleProps).to.have.property('dimensions').that.equals('600px x 480px')
        expect(consoleProps).to.have.property('disableTimersAndAnimations').that.is.a('boolean')
        expect(consoleProps).to.have.property('duration').that.is.a('string')
        expect(consoleProps).to.have.property('multipart').that.is.a('boolean')
        expect(consoleProps).to.have.property('name').to.be.null
        expect(consoleProps).to.have.property('path').that.is.a('string')
        expect(consoleProps).to.have.property('pixelRatio').that.is.a('number')
        expect(consoleProps).to.have.property('scaled').that.is.a('boolean')
        expect(consoleProps).to.have.property('size').that.is.a('string')
        expect(consoleProps).to.have.property('specName').that.is.a('string')
        expect(consoleProps).to.have.property('takenAt').that.is.a('string')
        expect(consoleProps).to.have.property('testAttemptIndex').that.is.a('number')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      // FIXME: viewports don't seems correct after taking screenshot when in snapshot mode
      cy.screenshot({ capture: 'fullPage' })
    })
  })
})
