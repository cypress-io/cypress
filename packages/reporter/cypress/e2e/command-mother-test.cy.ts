import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { addCommand } from '../support/utils'

describe('commands', () => {
  let runner: EventEmitter
  let runnables: RootRunnable
  const inProgressStartedAt = (new Date(2000, 0, 1)).toISOString()

  beforeEach(() => {
    cy.fixture('runnables_commands').then((_runnables) => {
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

    cy.contains('http://localhost:3000') // ensure test content has loaded
  })

  it('displays all the commands', () => {
    addCommand(runner, {
      id: 9,
      name: 'get',
      message: '#in-progress',
      state: 'pending',
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 102,
      name: 'get',
      message: '#element',
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 124,
      name: 'within',
      type: 'child',
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 125,
      name: 'get',
      message: '#my_element',
      group: 124,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 129,
      name: 'within',
      state: 'passed',
      type: 'child',
      group: 124,
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 130,
      name: 'get',
      message: '#my_element that _has_ a really long message to show **wrapping** works as expected',
      state: 'passed',
      timeout: 4000,
      groupLevel: 2,
      group: 129,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1229,
      name: 'within',
      state: 'passed',
      type: 'child',
      group: 129,
      groupLevel: 2,
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1311,
      name: 'get',
      message: '#my_element_nested',
      state: 'passed',
      timeout: 4000,
      groupLevel: 3,
      group: 1229,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 182,
      name: 'xhr',
      event: true,
      state: 'passed',
      timeout: 4000,
      renderProps: {
        indicator: 'bad',
        message: `bad indicator`,
      },
      groupLevel: 3,
      group: 1229,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1291,
      name: 'assert',
      type: 'child',
      message: 'has class named .omg',
      state: 'passed',
      timeout: 4000,
      group: 1229,
      groupLevel: 3,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1291,
      name: 'log',
      message: 'do something else',
      state: 'passed',
      timeout: 4000,
      group: 129,
      groupLevel: 2,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 135,
      name: 'and',
      type: 'child',
      message: 'has class named .lets-roll',
      state: 'passed',
      timeout: 4000,
      group: 124,
      wallClockStartedAt: inProgressStartedAt,
    })

    const indicators = ['successful', 'pending', 'aborted', 'bad']

    indicators.forEach((indicator, index) => {
      addCommand(runner, {
        id: 1600 + index,
        name: 'xhr',
        event: true,
        state: 'passed',
        timeout: 4000,
        renderProps: {
          indicator,
          message: `${indicator} indicator`,
        },
        wallClockStartedAt: inProgressStartedAt,
      })
    })

    const assertStates = ['passed', 'pending', 'failed']

    assertStates.forEach((state, index) => {
      addCommand(runner, {
        id: 1700 + index,
        name: 'assert',
        type: 'child',
        message: 'expected **element** to have length of **16** but got **12** instead',
        state,
        timeout: 4000,
        wallClockStartedAt: inProgressStartedAt,
      })
    })

    addCommand(runner, {
      name: 'log',
      message: 'command-warn-state',
      state: 'warn',
    })

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

    addCommand(runner, {
      aliasType: 'route',
      name: '(xhr)',
      message: 'https://google.com/2l3j4l23j4l23j4l/souw04rml',
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

    const date = new Date(inProgressStartedAt).setMilliseconds(2500)

    cy.clock(date, ['Date'])
    cy.get('.command').should('have.length', 59)

    cy.percySnapshot()
  })
})
