import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderCommandEntryHuman } from '../../../lib/tap/render/command'
import type { TapCommandEntry } from '@packages/cypress-instances'

// chalk's color level depends on where the suite runs, so strip any escape
// codes before snapshotting — the assertions target the layout, not the colors.
const renderEntry = (entry: TapCommandEntry): string => stripAnsi(renderCommandEntryHuman(entry))

describe('lib/tap/render/command', () => {
  describe('log entry', () => {
    it('renders a network row as the reporter renders it, with the network panel', () => {
      const entry: TapCommandEntry = {
        id: '1',
        name: 'request',
        message: 'GET 200 https://jsonplaceholder.cypress.io/comments?postId=1&id=3',
        state: 'passed',
        type: 'parent',
        network: { indicator: 'successful' },
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "✓  1  request  ● GET 200 https://jsonplaceholder.cypress.io/comments?postId=1&id=3  passed

        NETWORK
          INDICATOR  ● successful"
      `)
    })

    it('renders every network field a stubbed, aliased row carries', () => {
      const entry: TapCommandEntry = {
        id: 'e2',
        name: 'request',
        message: 'PUT 404 https://jsonplaceholder.cypress.io/comments/1',
        state: 'passed',
        type: 'parent',
        network: {
          method: 'PUT',
          url: 'https://jsonplaceholder.cypress.io/comments/1',
          status: 404,
          indicator: 'bad',
          stubbed: true,
          numResponses: 1,
          alias: 'putComment',
        },
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "✓  e2  request  ● PUT 404 https://jsonplaceholder.cypress.io/comments/1  @putComment  (stubbed)  passed

        NETWORK
          METHOD     PUT
          URL        https://jsonplaceholder.cypress.io/comments/1
          STATUS     404
          INDICATOR  ● bad
          STUBBED    yes
          RESPONSES  1
          ALIAS      @putComment"
      `)
    })

    // A row of the test body carries no hook, so only a hook row gets the panel.
    it('names the hook section a row ran in', () => {
      const entry: TapCommandEntry = {
        id: '1',
        name: 'visit',
        message: '/login',
        state: 'passed',
        type: 'parent',
        hook: { hookId: 'h1', hookName: 'before each' },
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "✓  1  visit  /login  passed

        HOOK
          ID    h1
          NAME  before each"
      `)
    })

    // The attempt has no timing for a hook still running, so the id stands alone.
    it('renders an unnamed hook section as its id', () => {
      const entry: TapCommandEntry = { id: '2', name: 'get', message: '#user', state: 'pending', type: 'parent', hook: { hookId: 'h2' } }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "○  2  get  #user  pending

        HOOK
          ID  h2"
      `)
    })

    it('dash-prefixes a child command and renders its assert emphasis', () => {
      const entry: TapCommandEntry = {
        id: '4',
        name: 'assert',
        message: 'expected **[ Array(1) ]** to have a length of **1**',
        state: 'failed',
        type: 'child',
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`"✖  4  -assert  expected [ Array(1) ] to have a length of 1  failed"`)
    })

    it('marks a memory-evicted row, whose message the driver scrubbed', () => {
      const entry: TapCommandEntry = { id: '12', name: 'get', state: 'passed', type: 'parent', cleanedUp: true }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`"✓  12  get  (cleaned up)  passed"`)
    })

    // A cy.intercept registration is not a command: no id, no state.
    it('renders a stateless, id-less row without an icon or state word', () => {
      const entry: TapCommandEntry = {
        name: 'route',
        message: '',
        network: { method: 'GET', url: '**/comments/*', stubbed: false, alias: 'getComment' },
      }

      expect(renderEntry(entry)).toMatchInlineSnapshot(`
        "route  @getComment

        NETWORK
          METHOD   GET
          URL      **/comments/*
          STUBBED  no
          ALIAS    @getComment"
      `)
    })
  })
})
