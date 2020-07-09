const { EventEmitter } = require('events')
const { _ } = Cypress

const addLog = function (runner, log) {
  const defaultLog = {
    event: false,
    hookId: 'r3',
    id: _.uniqueId('l'),
    instrument: 'command',
    renderProps: {},
    state: 'passed',
    testId: 'r3',
    testCurrentRetry: 0,
    type: 'parent',
    url: 'http://example.com',
  }

  return runner.emit('reporter:log:add', _.extend(defaultLog, log))
}

describe('aliases', () => {
  context('route aliases', () => {
    beforeEach(function () {
      cy.fixture('runnables_aliases').as('runnables')

      this.runner = new EventEmitter()

      cy.visit('dist').then((win) => {
        return win.render({
          runner: this.runner,
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
        })
      })

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnables)

        return this.runner.emit('reporter:start', {})
      })
    })

    describe('without duplicates', () => {
      beforeEach(function () {
        addLog(this.runner, {
          alias: 'getUsers',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /users', indicator: 'passed' },
        })

        return addLog(this.runner, {
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
      })
    })

    describe('with consecutive duplicates', () => {
      beforeEach(function () {
        addLog(this.runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addLog(this.runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addLog(this.runner, {
          aliasType: 'route',
          message: '@getPosts, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getPosts',
            ordinal: '1st',
          }],
        })

        return addLog(this.runner, {
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
        .within(($commandWrapper) => {
          cy.get('.num-duplicates').should('not.be.visible')

          cy.contains('.command-alias', 'getPosts')
        })
      })
    })

    describe('with non-consecutive duplicates', () => {
      beforeEach(function () {
        addLog(this.runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addLog(this.runner, {
          alias: 'getUsers',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /users', indicator: 'passed' },
        })

        addLog(this.runner, {
          alias: 'getPosts',
          aliasType: 'route',
          displayName: 'xhr stub',
          event: true,
          name: 'xhr',
          renderProps: { message: 'GET --- /posts', indicator: 'passed' },
        })

        addLog(this.runner, {
          aliasType: 'route',
          message: '@getPosts, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getPosts',
            ordinal: '1st',
          }],
        })

        addLog(this.runner, {
          aliasType: 'route',
          message: '@getUsers, function(){}',
          name: 'wait',
          referencesAlias: [{
            cardinal: 1,
            name: 'getUsers',
            ordinal: '1st',
          }],
        })

        return addLog(this.runner, {
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
      })
    })
  })

  context('element aliases', () => {
    beforeEach(function () {
      cy.fixture('runnables_aliases').as('runnables')

      this.runner = new EventEmitter()

      cy.visit('cypress/support/index.html').then((win) => {
        return win.render({
          runner: this.runner,
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
        })
      })

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnables)

        return this.runner.emit('reporter:start', {})
      })
    })

    describe('without duplicates', () => {
      beforeEach(function () {
        addLog(this.runner, {
          state: 'passed',
          name: 'get',
          message: 'body',
          alias: 'barAlias',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        return addLog(this.runner, {
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
      beforeEach(function () {
        addLog(this.runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addLog(this.runner, {
          state: 'passed',
          name: 'get',
          message: 'select',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addLog(this.runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'dropdown',
            ordinal: '1st',
          }],
        })

        return addLog(this.runner, {
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
      beforeEach(function () {
        addLog(this.runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addLog(this.runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'modal\']',
          alias: 'modal',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addLog(this.runner, {
          state: 'passed',
          name: 'get',
          message: '[attr=\'dropdown\']',
          alias: 'dropdown',
          aliasType: 'dom',
          event: true,
          renderProps: { message: '', indicator: 'passed' },
        })

        addLog(this.runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'dropdown',
            ordinal: '1st',
          }],
        })

        addLog(this.runner, {
          aliasType: 'dom',
          message: '',
          name: 'get',
          referencesAlias: [{
            cardinal: 1,
            name: 'modal',
            ordinal: '1st',
          }],
        })

        return addLog(this.runner, {
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
