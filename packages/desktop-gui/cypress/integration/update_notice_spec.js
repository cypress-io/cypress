import human from 'human-interval'
import { deferred } from '../support/util'

describe('Update Notice', () => {
  let ipc
  let start
  let updaterCheck

  beforeEach(() => {
    let user

    cy.viewport(800, 500)
    cy.fixture('user').then((theUser) => user = theUser)

    cy.visitIndex().then((win) => {
      ipc = win.App.ipc
      start = win.App.start

      cy.stub(ipc, 'getCurrentUser').resolves(user)
      cy.stub(ipc, 'getOptions').resolves({ version: '1.0.0' })

      updaterCheck = deferred()

      cy.stub(ipc, 'updaterCheck').returns(updaterCheck.promise)
    })
  })

  it('does not appear if up-to-date', () => {
    start()
    cy.wait(500) // need to wait for animation or it will falsely appear invisible
    cy.get('.update-notice').should('not.be.visible')
  })

  describe('when there is an update', () => {
    beforeEach(() => {
      start()
      updaterCheck.resolve('1.0.1')
    })

    it('shows update notice', () => {
      cy.get('.update-notice').should('be.visible')
      cy.get('.update-notice .content').should('have.text', 'An update (1.0.1) is available. Learn more')
      cy.percySnapshot()
    })

    it('clicking on "Learn more" opens update modal and closes notice', () => {
      cy.get('.update-notice').contains('Learn more').click()

      cy.get('.update-modal').should('be.visible')
      cy.get('.update-notice').should('not.be.visible')
    })

    it('clicking close button closes notice', () => {
      cy.get('.update-notice .notification-close').click()

      cy.get('.update-notice').should('not.be.visible')
    })
  })

  describe('when there is an update that has already been dismissed', () => {
    let updaterCheck2

    beforeEach(() => {
      cy.clock()
      cy.window().then((win) => {
        win.localStorage.setItem('dismissed-update-version', JSON.stringify('1.0.1'))
        updaterCheck2 = deferred()
        ipc.updaterCheck.onCall(1).returns(updaterCheck2.promise)

        start()
        updaterCheck.resolve('1.0.1')
      })
    })

    it('does not show update notice', () => {
      cy.wait(500) // need to wait for animation or it will falsely appear invisible
      cy.get('.update-notice').should('not.be.visible')
    })

    it('shows update notice when a newer version is available', () => {
      cy.tick(human('60 minutes')).then(() => {
        updaterCheck2.resolve('1.0.2')
      })

      cy.get('.update-notice').should('be.visible')
      cy.get('.update-notice .content').should('have.text', 'An update (1.0.2) is available. Learn more')
    })
  })
})
