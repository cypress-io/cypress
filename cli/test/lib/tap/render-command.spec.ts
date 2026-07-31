import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderCommandHuman } from '../../../lib/tap/render/command'
import type { TapCommandResult } from '@packages/cypress-instances'

// chalk's color level depends on where the suite runs, so strip any escape
// codes before snapshotting — the assertions target the layout, not the colors.
const renderEntry = (entry: TapCommandResult, options?: { depth?: string, path?: string }): string => {
  return stripAnsi(renderCommandHuman(entry, options))
}

// The snapshot times render in the running machine's zone, so build them from a
// local wall clock rather than a fixed epoch value.
const at = (hours: number, minutes: number, seconds: number, ms: number): number => {
  return new Date(2026, 0, 2, hours, minutes, seconds, ms).getTime()
}

const TEST_BODY = { hookId: 'r2', hookName: 'test body' }

describe('lib/tap/render/command', () => {
  describe('log entry', () => {
    it('renders a network row as the reporter renders it, with the network panel', () => {
      const entry: TapCommandResult = {
        id: '1',
        name: 'request',
        message: 'GET 200 https://jsonplaceholder.cypress.io/comments?postId=1&id=3',
        state: 'passed',
        type: 'parent',
        hook: TEST_BODY,
        network: { indicator: 'successful' },
        snapshots: [],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  1  request  ● GET 200 https://jsonplaceholder.cypress.io/comments?postId=1&id=3  passed

        NETWORK
          INDICATOR  ● successful

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })

    it('renders every network field a stubbed, aliased row carries', () => {
      const entry: TapCommandResult = {
        id: 'e2',
        name: 'request',
        message: 'PUT 404 https://jsonplaceholder.cypress.io/comments/1',
        state: 'passed',
        type: 'parent',
        hook: TEST_BODY,
        network: {
          method: 'PUT',
          url: 'https://jsonplaceholder.cypress.io/comments/1',
          status: 404,
          indicator: 'bad',
          stubbed: true,
          numResponses: 1,
          alias: 'putComment',
        },
        snapshots: [],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  e2  request  ● PUT 404 https://jsonplaceholder.cypress.io/comments/1  @putComment  (stubbed)  passed

        NETWORK
          METHOD     PUT
          URL        https://jsonplaceholder.cypress.io/comments/1
          STATUS     404
          INDICATOR  ● bad
          STUBBED    yes
          RESPONSES  1
          ALIAS      @putComment

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })

    it('names the hook section a row ran in', () => {
      const entry: TapCommandResult = {
        id: '1',
        name: 'visit',
        message: '/login',
        state: 'passed',
        type: 'parent',
        hook: { hookId: 'h1', hookName: 'before each' },
        snapshots: [],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "BEFORE EACH · h1
        ✓  1  visit  /login  passed

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })

    // The attempt has no timing for a hook still running, so the id stands alone.
    it('renders an unnamed hook section as its id', () => {
      const entry: TapCommandResult = { id: '2', name: 'get', message: '#user', state: 'pending', type: 'parent', hook: { hookId: 'h2' }, snapshots: [] }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "COMMANDS · h2
        ○  2  get  #user  pending

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })

    it('dash-prefixes a child command and renders its assert emphasis', () => {
      const entry: TapCommandResult = {
        id: '4',
        name: 'assert',
        message: 'expected **[ Array(1) ]** to have a length of **1**',
        state: 'failed',
        type: 'child',
        hook: TEST_BODY,
        snapshots: [],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✖  4  -assert  expected [ Array(1) ] to have a length of 1  failed

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })

    it('marks a memory-evicted row, whose message the driver scrubbed', () => {
      const entry: TapCommandResult = {
        id: '12',
        name: 'get',
        state: 'passed',
        type: 'parent',
        hook: TEST_BODY,
        cleanedUp: true,
        snapshots: [],
        consoleProps: { Message: 'The command details and snapshot has been cleaned up to reduce the number of tests in memory.' },
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  12  get  (cleaned up)  passed

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          Message  The command details and snapshot has been cleaned up to reduce the number of tests in memory."
      `)
    })

    // A cy.intercept registration is not a command: no id, no state.
    it('renders a stateless, id-less row without an icon or state word', () => {
      const entry: TapCommandResult = {
        name: 'route',
        message: '',
        hook: TEST_BODY,
        network: { method: 'GET', url: '**/comments/*', stubbed: false, alias: 'getComment' },
        snapshots: [],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        route  @getComment

        NETWORK
          METHOD   GET
          URL      **/comments/*
          STUBBED  no
          ALIAS    @getComment

        SNAPSHOTS (0)
          [NO SNAPSHOTS]

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })
  })

  describe('snapshots', () => {
    it('lists the pinnable snapshots by name and capture time', () => {
      const entry: TapCommandResult = {
        id: '3',
        name: 'click',
        message: '#submit',
        state: 'passed',
        type: 'child',
        hook: TEST_BODY,
        snapshots: [
          { index: 1, name: 'before', timestamp: at(14, 3, 22, 481) },
          { index: 2, name: 'after', timestamp: at(14, 3, 22, 613) },
        ],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  3  -click  #submit  passed

        SNAPSHOTS (2)
          #  NAME    TIME
          1  before  14:03:22.481
          2  after   14:03:22.613

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })

    // A command that captured a single snapshot leaves it unnamed, and a
    // snapshot the driver never stamped has no time to show.
    it('renders an unnamed, unstamped snapshot as absent fields', () => {
      const entry: TapCommandResult = {
        id: '2',
        name: 'get',
        message: '#user',
        state: 'passed',
        type: 'parent',
        hook: TEST_BODY,
        snapshots: [{ index: 1 }],
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  2  get  #user  passed

        SNAPSHOTS (1)
          #  NAME  TIME
          1  —     —

        CONSOLE PROPS
          [NO CONSOLE PROPS]"
      `)
    })
  })

  describe('console props', () => {
    const withProps: TapCommandResult = {
      id: '2',
      name: 'get',
      message: '#user',
      state: 'passed',
      type: 'parent',
      hook: TEST_BODY,
      snapshots: [{ index: 1, name: 'before', timestamp: at(14, 3, 22, 481) }],
      consoleProps: {
        name: 'get',
        type: 'command',
        props: {
          Selector: '#user',
          Elements: 1,
          Yielded: '<input#user>',
          Options: { timeout: 4000, log: true },
        },
      },
    }

    it('closes the view with the command’s console properties', () => {
      expect(renderEntry(withProps)).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  2  get  #user  passed

        SNAPSHOTS (1)
          #  NAME    TIME
          1  before  14:03:22.481

        CONSOLE PROPS
          Selector  #user
          Elements  1
          Yielded   <input#user>
          Options
            timeout  4000
            log      true"
      `)
    })

    it('drills into one section of the properties with --path', () => {
      expect(renderEntry(withProps, { path: 'Options' })).toMatchInlineSnapshot(`
        "TEST BODY · r2
        ✓  2  get  #user  passed

        SNAPSHOTS (1)
          #  NAME    TIME
          1  before  14:03:22.481

        CONSOLE PROPS › Options
          timeout  4000
          log      true"
      `)
    })
  })
})
