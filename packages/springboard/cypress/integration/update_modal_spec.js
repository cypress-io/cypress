import human from 'human-interval'
import { deferred } from '../support/util'

const OLD_VERSION = '1.3.3'
const NEW_VERSION = '1.3.4'

describe('Update Modal', () => {
  let user
  let start
  let ipc
  let updaterCheck

  beforeEach(() => {
    cy.viewport(800, 500)
    cy.fixture('user').then((theUser) => user = theUser)
    cy.fixture('projects').as('projects')
    cy.fixture('config').as('config')

    cy.visitIndex({
      onBeforeLoad (win) {
        cy.spy(win, 'setInterval')
      },
    }).then((win) => {
      start = win.App.start
      ipc = win.App.ipc

      cy.stub(ipc, 'getCurrentUser').resolves(user)
      cy.stub(ipc, 'externalOpen')
      cy.stub(ipc, 'setClipboardText')

      updaterCheck = deferred()

      cy.stub(ipc, 'updaterCheck').returns(updaterCheck.promise)
    })
  })

  describe('general behavior', () => {
    beforeEach(() => {
      cy.stub(ipc, 'getOptions').resolves({ version: OLD_VERSION })

      start()
    })

    it('checks for updates every 60 minutes', () => {
      cy.window().then((win) => {
        expect(win.setInterval.firstCall.args[1]).to.eq(human('60 minutes'))
      })
    })

    it('checks for update on show', () => {
      cy.wrap(ipc.updaterCheck).should('be.called')
    })

    it('gracefully handles error', () => {
      updaterCheck.reject({ name: 'foo', message: 'Something bad happened' })

      cy.get('.footer').should('be.visible')
    })

    it('opens modal on click of Update link', () => {
      updaterCheck.resolve(NEW_VERSION)
      cy.get('.footer .version').click()

      cy.get('.modal').should('be.visible')
    })

    it('closes modal when X is clicked', () => {
      updaterCheck.resolve(NEW_VERSION)
      cy.get('.footer .version').click()
      cy.get('.modal').find('.close').click()

      cy.get('.modal').should('not.exist')
    })
  })

  describe('in global mode', () => {
    beforeEach(() => {
      cy.stub(ipc, 'getOptions').resolves({ version: OLD_VERSION, os: 'linux' })
      start()
      updaterCheck.resolve(NEW_VERSION)

      cy.get('.footer .version').click()
    })

    it('modal has info about downloading new version', () => {
      cy.get('.modal').contains('Download the new version')
    })

    it('opens download link when Download is clicked', () => {
      cy.contains('Download the new version').click().then(() => {
        expect(ipc.externalOpen).to.be.calledWith('https://download.cypress.io/desktop')
      })
    })
  })

  describe('in project mode', () => {
    const npmCommand = `npm install --save-dev cypress@${NEW_VERSION}`
    const yarnCommand = `yarn upgrade cypress@${NEW_VERSION}`

    beforeEach(() => {
      cy.stub(ipc, 'getOptions').resolves({ version: OLD_VERSION, projectRoot: '/foo/bar' })
      start()
      updaterCheck.resolve(NEW_VERSION)

      cy.get('.footer .version').click()
    })

    it('modal has info about upgrading via package manager', () => {
      cy.get('.modal').contains(npmCommand)
      cy.get('.modal').contains(yarnCommand)
      cy.percySnapshot()
    })

    it('copies npm upgrade command to clipboard', () => {
      cy.contains(npmCommand).find('button').click()
      .then(() => {
        expect(ipc.setClipboardText).to.be.calledWith(npmCommand)
      })
    })

    it('changes npm upgrade button icon after copying', () => {
      cy.contains(npmCommand).find('button').click()
      cy.contains(npmCommand).find('button i').should('have.class', 'fa-check')
    })

    it('disables npm upgrade button after copying', () => {
      cy.contains(npmCommand).find('button').click().should('be.disabled')
    })

    it('resets npm upgrade button after 5 seconds', () => {
      cy.clock()
      cy.contains(npmCommand).find('button').click()
      cy.tick(5000)
      cy.contains(npmCommand).find('button i').should('have.class', 'fa-copy')
      cy.contains(npmCommand).find('button').should('not.be.disabled')
    })

    it('copies yarn upgrade command to clipboard', () => {
      cy.contains(yarnCommand).find('button').click()
      .then(() => {
        expect(ipc.setClipboardText).to.be.calledWith(yarnCommand)
      })
    })

    it('changes yarn upgrade button icon after copying', () => {
      cy.contains(yarnCommand).find('button').click()
      cy.contains(yarnCommand).find('button i').should('have.class', 'fa-check')
    })

    it('disables yarn upgrade button after copying', () => {
      cy.contains(yarnCommand).find('button').click().should('be.disabled')
    })

    it('resets yarn upgrade button after 5 seconds', () => {
      cy.clock()
      cy.contains(yarnCommand).find('button').click()
      cy.tick(5000)
      cy.contains(yarnCommand).find('button i').should('have.class', 'fa-copy')
      cy.contains(yarnCommand).find('button').should('not.be.disabled')
    })

    it('links to \'open\' doc on click of open command', () => {
      cy.contains('cypress open').click().then(() => {
        expect(ipc.externalOpen).to.be.calledWith('https://on.cypress.io/how-to-open-cypress')
      })
    })
  })
})
