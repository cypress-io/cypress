const { EventEmitter } = require('events')
import sinon from 'sinon'

describe('banner', function () {
  beforeEach(function () {
    cy.fixture('runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter').then(() => {
      this.runner.emit('runnables:ready', this.runnables)
      this.runner.emit('reporter:start', {})
      this.runner.emit('reload:configuration', {})
    })
  })

  describe('banner', function () {
    it('does not show banner if no config changes', function () {
      cy.get('.banner').should('not.exist')
    })

    it('shows banner with path to file on change', function () {
      this.file = 'app/path/to/file'
      cy.get('.reporter').then(() => {
        this.runner.emit('config:changed', this.file)
      })

      cy.get('.banner').should('contain', this.file)
    })

    it('emits reload:configuration event on click of restart', function () {
      cy.get('.reporter').then(() => {
        this.reloadRunner = sinon.spy()

        this.runner.on('reload:configuration', this.reloadRunner)
        this.runner.emit('config:changed', 'app/path/to/file')
      })

      cy.get('.banner').contains('Restart').click().then(() => {
        expect(this.reloadRunner).to.be.called
      })
    })

    it('hides banner on click of restart', function () {
      cy.get('.banner').should('not.exist')
      cy.get('.reporter').then(() => {
        this.runner.emit('config:changed', 'app/path/to/file')
      })

      cy.get('.banner').contains('Restart').click()
      cy.get('.banner').should('not.exist')
    })
  })
})
