const human = require('human-interval')

const OLD_VERSION = '1.3.3'
const NEW_VERSION = '1.3.4'

describe('Updates', function () {
  beforeEach(function () {
    cy.viewport(800, 500)
    cy.fixture('user').as('user')
    cy.fixture('projects').as('projects')
    cy.fixture('projects_statuses').as('projectStatuses')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')

    cy.visitIndex({
      onBeforeLoad (win) {
        cy.spy(win, 'setInterval')
      },
    }).then(function (win) {
      ({ start: this.start, ipc: this.ipc } = win.App)

      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'windowOpen')
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'setClipboardText')

      this.updaterCheck = this.util.deferred()

      cy.stub(this.ipc, 'updaterCheck').returns(this.updaterCheck.promise)
    })
  })

  describe('general behavior', function () {
    beforeEach(function () {
      cy.stub(this.ipc, 'getOptions').resolves({ version: OLD_VERSION })

      this.start()
    })

    it('checks for updates every 60 minutes', () => {
      cy.window().then((win) => {
        expect(win.setInterval.firstCall.args[1]).to.eq(human('60 minutes'))
      })
    })

    it('checks for update on show', function () {
      cy.wrap(this.ipc.updaterCheck).should('be.called')
    })

    it('gracefully handles error', function () {
      this.updaterCheck.reject({ name: 'foo', message: 'Something bad happened' })

      cy.get('.footer').should('be.visible')
    })

    it('opens modal on click of Update link', function () {
      this.updaterCheck.resolve(NEW_VERSION)
      cy.get('.footer .version').click()

      cy.get('.modal').should('be.visible')
    })

    it('closes modal when X is clicked', function () {
      this.updaterCheck.resolve(NEW_VERSION)
      cy.get('.footer .version').click()
      cy.get('.modal').find('.close').click()

      cy.get('.modal').should('not.be.visible')
    })
  })

  describe('in global mode', function () {
    beforeEach(function () {
      cy.stub(this.ipc, 'getOptions').resolves({ version: OLD_VERSION, os: 'linux' })
      this.start()
      this.updaterCheck.resolve(NEW_VERSION)

      cy.get('.footer .version').click()
    })

    it('modal has info about downloading new version', () => {
      cy.get('.modal').contains('Download the new version')
    })

    it('opens download link when Download is clicked', function () {
      cy.contains('Download the new version').click().then(() => {
        expect(this.ipc.externalOpen).to.be.calledWith('https://download.cypress.io/desktop')
      })
    })
  })

  describe('in project mode', function () {
    const npmCommand = `npm install --save-dev cypress@${NEW_VERSION}`
    const yarnCommand = `yarn upgrade cypress@${NEW_VERSION}`

    beforeEach(function () {
      cy.stub(this.ipc, 'getOptions').resolves({ version: OLD_VERSION, projectRoot: '/foo/bar' })
      this.start()
      this.updaterCheck.resolve(NEW_VERSION)

      cy.get('.footer .version').click()
    })

    it('modal has info about upgrading via package manager', function () {
      cy.get('.modal').contains(npmCommand)
      cy.get('.modal').contains(yarnCommand)
      cy.percySnapshot()
    })

    it('copies npm upgrade command to clipboard', function () {
      cy.contains(npmCommand).find('button').click()
      .then(() => {
        expect(this.ipc.setClipboardText).to.be.calledWith(npmCommand)
      })
    })

    it('changes npm upgrade button icon after copying', function () {
      cy.contains(npmCommand).find('button').click()
      cy.contains(npmCommand).find('button i').should('have.class', 'fa-check')
    })

    it('disables npm upgrade button after copying', function () {
      cy.contains(npmCommand).find('button').click().should('be.disabled')
    })

    it('resets npm upgrade button after 5 seconds', function () {
      cy.clock()
      cy.contains(npmCommand).find('button').click()
      cy.tick(5000)
      cy.contains(npmCommand).find('button i').should('have.class', 'fa-copy')
      cy.contains(npmCommand).find('button').should('not.be.disabled')
    })

    it('copies yarn upgrade command to clipboard', function () {
      cy.contains(yarnCommand).find('button').click()
      .then(() => {
        expect(this.ipc.setClipboardText).to.be.calledWith(yarnCommand)
      })
    })

    it('changes yarn upgrade button icon after copying', function () {
      cy.contains(yarnCommand).find('button').click()
      cy.contains(yarnCommand).find('button i').should('have.class', 'fa-check')
    })

    it('disables yarn upgrade button after copying', function () {
      cy.contains(yarnCommand).find('button').click().should('be.disabled')
    })

    it('resets yarn upgrade button after 5 seconds', function () {
      cy.clock()
      cy.contains(yarnCommand).find('button').click()
      cy.tick(5000)
      cy.contains(yarnCommand).find('button i').should('have.class', 'fa-copy')
      cy.contains(yarnCommand).find('button').should('not.be.disabled')
    })

    it('links to \'open\' doc on click of open command', function () {
      cy.contains('cypress open').click().then(() => {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/how-to-open-cypress')
      })
    })
  })
})
