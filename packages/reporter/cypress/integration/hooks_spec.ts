import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('hooks', function () {
  beforeEach(function () {
    cy.fixture('runnables_hooks').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner: this.runner,
        spec: {
          name: 'foo.js',
          relative: 'relative/path/to/foo.js',
          absolute: '/absolute/path/to/foo.js',
        },
      })
    })

    cy.get('.reporter').then(() => {
      this.runner.emit('runnables:ready', this.runnables)

      this.runner.emit('reporter:start', {})
    })
  })

  describe('group hooks', function () {
    beforeEach(function () {
      cy.contains('test 1').click()
    })

    it('assigns commands to the correct hook', function () {
      cy.contains('before each').closest('.collapsible').find('.command').should('have.length', 2)
      cy.contains('before each').closest('.collapsible').should('contain', 'http://localhost:3000')
      cy.contains('before each').closest('.collapsible').should('contain', '.wrapper')

      cy.contains('test body').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('test body').closest('.collapsible').should('contain', '.body')

      cy.contains('after each').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('after each').closest('.collapsible').should('contain', '.cleanup')
    })

    it('displays hooks in the correct order', function () {
      const hooks = ['before each', 'test body', 'after each']

      cy.get('.hooks-container').find('span.hook-name').each(function (name, i) {
        cy.wrap(name).should('contain', hooks[i])
      })
    })
  })

  describe('split hooks', function () {
    beforeEach(function () {
      cy.contains('test 2').click()
    })

    it('splits different hooks with the same name', function () {
      cy.contains('before all (1)').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('before all (1)').closest('.collapsible').should('contain', 'before1')

      cy.contains('before all (2)').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('before all (2)').closest('.collapsible').should('contain', 'before2')

      cy.contains('before each (1)').closest('.collapsible').find('.command').should('have.length', 2)
      cy.contains('before each (1)').closest('.collapsible').should('contain', 'http://localhost:3000')
      cy.contains('before each (1)').closest('.collapsible').should('contain', '.wrapper')

      cy.contains('before each (2)').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('before each (2)').closest('.collapsible').should('contain', '.header')
    })

    it('does not display hook number when only one', function () {
      cy.get('.hooks-container').should('contain', 'after each')
      cy.get('.hooks-container').should('not.contain', 'after each (1)')
    })
  })

  describe('open hooks in IDE', function () {
    beforeEach(function () {
      cy.contains('test 1').click()
    })

    it('does not display button without hover', function () {
      cy.contains('Open in IDE').should('not.be.visible')
    })

    it('creates button when hook has invocation details', function () {
      cy.contains('before each').closest('.hook-header').should('contain', 'Open in IDE')
    })

    it('creates button when test has invocation details', function () {
      cy.contains('test body').closest('.hook-header').should('contain', 'Open in IDE')
    })

    it('does not create button when hook does not have invocation details', function () {
      cy.contains('after each').closest('.hook-header').should('not.contain', 'Open in IDE')
    })

    describe('handles file opening', function () {
      beforeEach(function () {
        cy.get('.hook-open-in-ide').first().invoke('show')
      })

      itHandlesFileOpening('.hook-open-in-ide', {
        file: '/absolute/path/to/foo_spec.js',
        column: 4,
        line: 10,
      })
    })
  })
})
