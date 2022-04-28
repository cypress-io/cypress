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
        runnerStore: {
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
        },
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  context('interceptions + status', () => {
    it('shows only status if no alias or dupe', () => {
      addCommand(runner, {
        aliasType: 'route',
        renderProps: {
          wentToOrigin: true,
          status: 'some status',
          interceptions: [{
            type: 'spy',
            command: 'intercept',
          }],
        },
      })

      cy.contains('.command-number-column', '1')
      .closest('.command-wrapper')
      .find('.command-interceptions')
      .should('have.text', 'some status no alias')
      .trigger('mouseover')
      .get('.cy-tooltip')
      .should('have.text', 'This request matched:cy.intercept() spy with no alias')
      .percySnapshot()
    })

    it('shows status and count if dupe', () => {
      addCommand(runner, {
        aliasType: 'route',
        name: 'command',
        renderProps: {
          wentToOrigin: true,
          status: 'some status',
          interceptions: [{
            type: 'spy',
            command: 'intercept',
          }, {
            type: 'spy',
            command: 'route',
          }],
        },
      })

      cy.contains('.command-number-column', '1')
      .closest('.command-wrapper')
      .find('.command-interceptions')
      .should('contain.text', 'some status no alias')
      .parent().find('.command-interceptions-count')
      .should('contain.text', '2')
      .trigger('mouseover')
      .get('.cy-tooltip').should('have.text', 'This request matched:cy.intercept() spy with no aliascy.route() spy with no alias')
      .percySnapshot()
    })

    it('shows status and alias and count if dupe', () => {
      addCommand(runner, {
        aliasType: 'route',
        alias: 'myAlias',
        renderProps: {
          wentToOrigin: true,
          status: 'some status',
          interceptions: [{
            type: 'spy',
            command: 'intercept',
            alias: 'firstAlias',
          }, {
            type: 'spy',
            command: 'intercept',
            alias: 'myAlias',
          }],
        },
      })

      cy.contains('.command-number-column', '1')
      .closest('.command-wrapper')
      .find('.command-interceptions')
      .should('contains.text', 'some status myAlias')
      .parent().find('.command-interceptions-count')
      .should('contains.text', '2')
      .trigger('mouseover')
      .get('.cy-tooltip').should('have.text', 'This request matched:cy.intercept() spy with alias @firstAliascy.intercept() spy with alias @myAlias')
      .percySnapshot()
    })

    it('shows status and alias', () => {
      addCommand(runner, {
        aliasType: 'route',
        alias: 'myAlias',
        renderProps: {
          wentToOrigin: true,
          status: 'some status',
          interceptions: [{
            type: 'spy',
            command: 'intercept',
            alias: 'myAlias',
          }],
        },
      })

      cy.contains('.command-number-column', '1')
      .closest('.command-wrapper')
      .find('.command-interceptions')
      .should('have.text', 'some status myAlias')
      .trigger('mouseover')
      .get('.cy-tooltip').should('have.text', 'This request matched:cy.intercept() spy with alias @myAlias')
      .percySnapshot()
    })
  })

  context('route aliases', () => {
    describe('without duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          alias: 'getUsers',
          aliasType: 'route',
          displayName: 'xhr',
          event: true,
          name: 'xhr',
          renderProps: {
            message: 'GET --- /users',
            indicator: 'successful',
            wentToOrigin: false,
            interceptions: [{
              type: 'stub',
              command: 'route',
              alias: 'getUsers',
            }],
          },
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
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
        .find('.command-alias')
        .should('have.class', 'route')
      })

      it('render without a count', () => {
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
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
          displayName: 'xhr',
          event: true,
          name: 'xhr',
          // @ts-ignore
          renderProps: { message: 'GET --- /posts', indicator: 'successful', interceptions: [{ alias: 'getPosts' }] },
        })

        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr',
          event: true,
          name: 'xhr',
          // @ts-ignore
          renderProps: { message: 'GET --- /posts', indicator: 'successful', interceptions: [{ alias: 'getPosts' }] },
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
        cy.get('.command-alias').should('have.length', 2)
        cy.percySnapshot()
      })

      it('render with counts in non-event commands', () => {
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
        .within(() => {
          cy.contains('.command-alias-count', '1')

          cy.contains('.command-alias', '@getPosts')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found 1st alias for: \'getPosts\'')
        })

        cy.contains('.command-number-column', '2')
        .should('be.visible')
        .closest('.command-wrapper')
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
          cy.contains('.num-children', '2').should('be.visible')

          cy.contains('.command-interceptions', 'getPosts')
        })
      })

      it('render without counts in event commands when expanded', () => {
        cy.get('.command-expander')
        .first()
        .click()

        cy.get('.command-wrapper')
        .first()
        .within(() => {
          cy.get('.num-children').should('not.exist')

          cy.contains('.command-interceptions', 'getPosts')
        })
      })
    })

    describe('with non-consecutive duplicates', () => {
      beforeEach(() => {
        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr',
          event: true,
          name: 'xhr',
          renderProps: {
            message: 'GET --- /users',
            indicator: 'successful',
            wentToOrigin: false,
            interceptions: [{
              type: 'stub',
              command: 'route',
              alias: 'getUsers',
            }],
          },
        })

        addCommand(runner, {
          alias: 'getUsers',
          aliasType: 'route',
          displayName: 'xhr',
          event: true,
          name: 'xhr',
          renderProps: {
            message: 'GET --- /users',
            indicator: 'successful',
            wentToOrigin: false,
            interceptions: [{
              type: 'stub',
              command: 'route',
              alias: 'getUsers',
            }],
          },
        })

        addCommand(runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr',
          event: true,
          name: 'xhr',
          renderProps: {
            message: 'GET --- /posts',
            indicator: 'successful',
            wentToOrigin: false,
            interceptions: [{
              type: 'stub',
              command: 'route',
              alias: 'getPosts',
            }],
          },
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
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
        .within(() => {
          cy.contains('.command-alias-count', '1')

          cy.contains('.command-alias', '@getPosts')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found 1st alias for: \'getPosts\'')
        })

        cy.contains('.command-number-column', '3')
        .closest('.command-wrapper')
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
          renderProps: { message: '', indicator: 'successful' },
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
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
        .find('.command-alias')
        .should('have.class', 'dom')
        .percySnapshot()
      })

      it('render without a count', () => {
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
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
          renderProps: { message: '', indicator: 'successful' },
        })

        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: 'select',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'successful' },
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
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })

        cy.contains('.command-number-column', '2')
        .closest('.command-wrapper')
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })
        .percySnapshot()
      })

      it('render without counts in event commands when collapsed', () => {
        cy.get('.command-wrapper')
        .first()
        .within(() => {
          cy.get('.num-children').should('not.exist')

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
          renderProps: { message: '', indicator: 'successful' },
        })

        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'modal\']',
          alias: 'modal',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'successful' },
        })

        addCommand(runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'successful' },
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
        cy.contains('.command-number-column', '1')
        .closest('.command-wrapper')
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })

        cy.contains('.command-number-column', '3')
        .closest('.command-wrapper')
        .within(() => {
          cy.get('.command-alias-count').should('not.exist')

          cy.contains('.command-alias', '@dropdown')
          .trigger('mouseover')
        })

        cy.get('.cy-tooltip span').should(($tooltip) => {
          expect($tooltip).to.contain('Found an alias for: \'dropdown\'')
        })
        .percySnapshot()
      })
    })
  })
})
