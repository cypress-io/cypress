const human = require('human-interval')

const OLD_VERSION = '1.3.3'
const NEW_VERSION = '1.3.4'

describe('Update Banner', function () {
  beforeEach(function () {
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

    it('does not display update banner when no update available', function () {
      this.updaterCheck.resolve(false)

      cy.get('.updates-available').should('not.exist')

      cy.get('html').should('not.have.class', 'has-updates')
    })

    it('checks for update on show', function () {
      cy.wrap(this.ipc.updaterCheck).should('be.called')
    })

    it('displays banner if new version is available', function () {
      this.updaterCheck.resolve(NEW_VERSION)
      cy.get('.updates-available').should('be.visible')
      cy.contains('New updates are available')

      cy.get('html').should('have.class', 'has-updates')
    })

    it('gracefully handles error', function () {
      this.updaterCheck.reject({ name: 'foo', message: 'Something bad happened' })

      cy.get('.footer').should('be.visible')
    })

    it('opens modal on click of Update link', function () {
      this.updaterCheck.resolve(NEW_VERSION)
      cy.contains('Update').click()

      cy.get('.modal').should('be.visible')
    })

    it('closes modal when X is clicked', function () {
      this.updaterCheck.resolve(NEW_VERSION)
      cy.contains('Update').click()
      cy.get('.modal').find('.close').click()

      cy.get('.modal').should('not.be.visible')
    })
  })

  describe('in global mode', function () {
    beforeEach(function () {
      cy.stub(this.ipc, 'getOptions').resolves({ version: OLD_VERSION, os: 'linux' })
      this.start()
      this.updaterCheck.resolve(NEW_VERSION)

      cy.contains('Update').click()
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
    beforeEach(function () {
      cy.stub(this.ipc, 'getOptions').resolves({ version: OLD_VERSION, projectRoot: '/foo/bar' })
      this.start()
      this.updaterCheck.resolve(NEW_VERSION)

      cy.contains('Update').click()
    })

    it('modal has info about updating package.json', function () {
      cy.get('.modal').contains(`npm install --save-dev cypress@${NEW_VERSION}`)

      cy.get('.modal').contains(`yarn upgrade cypress@${NEW_VERSION}`)
      cy.percySnapshot()
    })

    it('links to \'open\' doc on click of open command', function () {
      cy.get('.modal').contains('cypress open').click().then(() => {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/how-to-open-cypress')
      })
    })

    it('opens changelog when new version is clicked', function () {
      cy.get('.modal').contains(NEW_VERSION).click().then(() => {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/changelog')
      })
    })
  })

  describe('in specs list', function () {
    beforeEach(function () {
      cy.stub(this.ipc, 'getOptions').resolves({ version: OLD_VERSION, projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      this.start()
      this.updaterCheck.resolve(NEW_VERSION)

      cy.get('.updates-available')
    })

    it('displays all folders/specs within visible area', () => {
      cy.get('.folder-name')
      .last()
      .scrollIntoView()
      .should('be.visible')

      cy.get('.file-name')
      .last()
      .scrollIntoView()
      .should('be.visible')
    })
  })
})
