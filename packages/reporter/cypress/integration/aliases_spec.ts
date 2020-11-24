import { EventEmitter } from 'events'
import { RootRunnable } from './../../src/runnables/runnables-store'
import { addCommand } from '../support/utils'

describe('aliases', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  beforeEach(() => {
    cy.fixture('runnables_aliases').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo',
          absolute: '/foo/bar',
          relative: 'foo/bar',
        },
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  context('route aliases', () => {
    describe('without duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          alias: 'getUsers',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /users', indicator: 'passed' },
        })

        addCommand(runner, {
          aliasType: 'route',
          message: '@getUsers, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getUsers',
            ordinal: '1st',
          }],
        })
      })

      it('has correct alias class', () => {
        cy.contains('.command-number', '1')
        .parent()
        .find('.command-alias')
        .should('have.class', 'route')
      })

      it('render without a count', () => {
        cy.contains('.command-number', '1')
        .parent()
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@getUsers')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'getUsers\'')
        })

        cy.percySnapshot()
      })
    })

    describe('with consecutive duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addCommand(runner, {
          aliasType: 'route',
          message: '@getPosts, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getPosts',
            ordinal: '1st',
          }],
        })

        addCommand(runner, {
          aliasType: 'route',
          message: '@getPosts, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 2,
            name: 'getPosts',
            ordinal: '2nd',
          }],
        })
      })

      it('renders all aliases ', () => {
        cy.get('.command-alias').should('have.length', 3)
        cy.percySnapshot()
      })

      it('render with counts in non-event commands', () => {
        cy.contains('.command-number', '1')
        .parent()
        .within(() => {
          cy.contains('.command-alias-count', '1')

          cy.contains('.command-alias', '@getPosts')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found 1st alias for: \'getPosts\'')
        })

        cy.contains('.command-number', '2')
        .parent()
        .within(() => {
          cy.contains('.command-alias-count', '2')

          cy.contains('.command-alias', '@getPosts')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found 2nd alias for: \'getPosts\'')
        })
      })

      it('render with counts in event commands when collapsed', () => {
        cy.get('.command-wrapper')
        .first()
        .within(() => {
          cy.contains('.num-duplicates', '2')

          cy.contains('.command-alias', 'getPosts')
        })
      })

      it('render without counts in event commands when expanded', () => {
        cy.get('.command-expander')
        .first()
        .click()

        cy.get('.command-wrapper')
        .first()
        .within(() => {
          cy.get('.num-duplicates').should('not.be.visible')

          cy.contains('.command-alias', 'getPosts')
        })
      })
    })

    describe('with non-consecutive duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addCommand(runner, {
          alias: 'getUsers',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /users', indicator: 'passed' },
        })

        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addCommand(runner, {
          aliasType: 'route',
          message: '@getPosts, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getPosts',
            ordinal: '1st',
          }],
        })

        addCommand(runner, {
          aliasType: 'route',
          message: '@getUsers, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getUsers',
            ordinal: '1st',
          }],
        })

        addCommand(runner, {
          aliasType: 'route',
          message: '@getPosts, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 2,
            name: 'getPosts',
            ordinal: '2nd',
          }],
        })
      })

      it('render with counts', () => {
        cy.contains('.command-number', '1')
        .parent()
        .within(() => {
          cy.contains('.command-alias-count', '1')

          cy.contains('.command-alias', '@getPosts')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found 1st alias for: \'getPosts\'')
        })

        cy.contains('.command-number', '3')
        .parent()
        .within(() => {
          cy.contains('.command-alias-count', '2')

          cy.contains('.command-alias', '@getPosts')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found 2nd alias for: \'getPosts\'')
        })

        cy.percySnapshot()
      })
    })
  })

  context('element aliases', () => {
    describe('without duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: 'body',
          alias: 'barAlias',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addCommand(runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'barAlias',
            ordinal: '1st',
          }],
        })
      })

      it('has correct alias class', () => {
        cy.contains('.command-number', '1')
        .parent()
        .find('.command-alias')
        .should('have.class', 'dom')
      })

      it('render without a count', () => {
        cy.contains('.command-number', '1')
        .parent()
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@barAlias')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'barAlias\'')
        })
      })
    })

    describe('with consecutive duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: 'select',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addCommand(runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'dropdown',
            ordinal: '1st',
          }],
        })

        addCommand(runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 2,
            name: 'dropdown',
            ordinal: '2nd',
          }],
        })
      })

      it('render without a count in non-event commands', () => {
        cy.contains('.command-number', '1')
        .parent()
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })

        cy.contains('.command-number', '2')
        .parent()
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })
      })

      it('render without counts in event commands when collapsed', () => {
        cy.get('.command-wrapper')
        .first()
        .within(() => {
          cy.get('.num-duplicates').should('not.be.visible')

          cy.contains('.command-alias', 'dropdown')
        })
      })
    })

    describe('with non-consecutive duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'modal\']',
          alias: 'modal',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addCommand(runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'dropdown',
            ordinal: '1st',
          }],
        })

        addCommand(runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'modal',
            ordinal: '1st',
          }],
        })

        addCommand(runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 2,
            name: 'dropdown',
            ordinal: '2nd',
          }],
        })
      })

      it('renders all aliases ', () => {
        cy.get('.command-alias').should('have.length', 6)
      })

      it('render without counts', () => {
        cy.contains('.command-number', '1')
        .parent()
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })

        cy.contains('.command-number', '3')
        .parent()
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })
      })
    })
  })
})
