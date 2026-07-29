import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderReporterHuman, renderReporterSpecHuman } from '../../../lib/tap/render/reporter'
import type { TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'

// chalk's color level depends on where the suite runs, so strip any escape
// codes before snapshotting — the assertions target the layout, not the colors.
const renderPlain = (input: TapReporterView): string => stripAnsi(renderReporterHuman(input))

// Modeled on a real `reporter` result for the kitchensink network_requests
// spec: three intercepts (one stubbed), before-each visit, event xhr rows,
// markdown-emphasized assert messages.
const view: TapReporterView = {
  test: {
    id: 'r8',
    title: 'cy.intercept() - route responses to matching requests',
    fullTitle: 'Network Requests > cy.intercept() - route responses to matching requests',
    state: 'passed',
  },
  hooks: [
    { hookId: 'h1', hookName: 'before each' },
    { hookId: 'r8', hookName: 'test body' },
  ],
  sessions: [
    { name: 'all-commands-user', status: 'restored' },
    { name: 'admin-user', status: 'failed', global: true },
  ],
  agents: [
    { type: 'spy-1', functionName: 'beep', aliases: ['beep'], callCount: 1 },
    { type: 'stub-1', functionName: 'boop' },
  ],
  // Route registrations aren't commands, so they carry no id; numbered rows
  // carry the reporter's own per-section numbers, and event rows take the
  // attempt-wide `e` sequence.
  routes: [
    { method: 'GET', url: '**/comments/*', stubbed: false, alias: 'getComment' },
    { method: 'PUT', url: '**/comments/*', stubbed: true, status: 404, numResponses: 1, alias: 'putComment' },
  ],
  commands: [
    { id: '1', name: 'visit', message: 'http://localhost:8080/commands/network-requests', state: 'passed', type: 'parent', hookId: 'h1' },
    { id: '1', name: 'get', message: '.network-btn', state: 'passed', type: 'parent', hookId: 'r8' },
    { id: '2', name: 'click', message: '', state: 'passed', type: 'child', hookId: 'r8' },
    {
      id: 'e1', name: 'request', displayName: 'xhr', message: 'GET 200 https://jsonplaceholder.cypress.io/comments/1',
      state: 'passed', type: 'parent', hookId: 'r8', event: true,
      network: { method: 'GET', url: 'https://jsonplaceholder.cypress.io/comments/1', indicator: 'successful', stubbed: false, alias: 'getComment' },
    },
    { id: '3', name: 'wait', message: '@getComment', state: 'passed', type: 'parent', hookId: 'r8', referencedAliases: ['getComment'], aliasType: 'route' },
    { id: '4', name: 'assert', message: 'expected **200** to be one of **[ 200, 304 ]**', state: 'passed', type: 'child', hookId: 'r8' },
    {
      id: 'e2', name: 'request', displayName: 'xhr', message: 'PUT 404 https://jsonplaceholder.cypress.io/comments/1',
      state: 'passed', type: 'parent', hookId: 'r8', event: true,
      network: { method: 'PUT', url: 'https://jsonplaceholder.cypress.io/comments/1', indicator: 'bad', stubbed: true, alias: 'putComment' },
    },
    { id: '5', name: 'get', message: '.network-put-comment', state: 'failed', type: 'parent', hookId: 'r8' },
    { id: '6', name: 'session', message: 'user', state: 'passed', type: 'parent', hookId: 'r8', group: '5', groupLevel: 1 },
    {
      id: 'e3', name: 'spy-1', displayName: 'spy-1', message: 'beep()', state: 'passed', type: 'parent', hookId: 'r8', event: true,
      aliases: ['beep'], aliasType: 'agent',
    },
    { id: '7', name: 'get', message: '@beep', state: 'passed', type: 'parent', hookId: 'r8', referencedAliases: ['beep'], aliasType: 'agent' },
    { id: '8', name: 'wrap', message: '{ table: 1 }', state: 'passed', type: 'parent', hookId: 'r8' },
    { id: '9', name: 'as', message: 'table', state: 'passed', type: 'child', hookId: 'r8', aliases: ['table'], aliasType: 'dom' },
    { id: 'e4', name: 'uncaught exception', message: 'Error: boom', state: 'failed', type: 'parent', hookId: 'r8', event: true },
  ],
}

describe('lib/tap/render/reporter', () => {
  it('renders the reporter panel: header, routes table, hook sections, numbered commands, event annotations', () => {
    expect(renderPlain(view)).toMatchInlineSnapshot(`
      "✓ Network Requests > cy.intercept() - route responses to matching requests  passed

      SESSIONS (2)
        all-commands-user  restored
        admin-user  (global)  failed

      SPIES / STUBS (2)
        TYPE    FUNCTION  ALIAS(ES)  CALLS
        spy-1   beep      beep       1
        stub-1  boop                 -

      ROUTES (2)
        METHOD  MATCHER        STUBBED  ALIAS        #
        GET     **/comments/*  no       @getComment  -
        PUT     **/comments/*  yes      @putComment  1

      BEFORE EACH · h1
         1  visit  http://localhost:8080/commands/network-requests

      TEST BODY · r8
         1  get      .network-btn
         2  -click
        e1    (xhr) ● GET 200 https://jsonplaceholder.cypress.io/comments/1  @getComment
         3  wait     @getComment
         4  -assert  expected 200 to be one of [ 200, 304 ]
        e2    (xhr) ● PUT 404 https://jsonplaceholder.cypress.io/comments/1  @putComment  (stubbed)
         5  get      .network-put-comment ✖
         6    session  user
        e3    (spy-1) beep()  @beep
         7  get      @beep
         8  wrap     { table: 1 }
         9  -as      table  @table
        e4    (uncaught exception) Error: boom ✖"
    `)
  })

  it('renders the error panel — name, message, and marked code frame — for a failed test', () => {
    const failed: TapReporterView = {
      test: { id: 'r6', title: '.clear() - clears an input', fullTitle: 'Actions > .clear() - clears an input', state: 'failed' },
      hooks: [{ hookId: 'r6', hookName: 'test body' }],
      sessions: [],
      agents: [],
      routes: [],
      commands: [
        { id: '1', name: 'get', message: '.action-clear', state: 'passed', type: 'parent', hookId: 'r6' },
        { id: '2', name: 'assert', message: 'expected **<input>** to have value **Clear this text**', state: 'failed', type: 'child', hookId: 'r6' },
      ],
      error: {
        name: 'AssertionError',
        message: `Timed out retrying after 4000ms: expected '<input#description>' to have value 'Clear this text', but the value was ''`,
        stack: 'AssertionError: Timed out retrying…\n  at <anonymous>',
        codeFrame: {
          file: 'cypress/e2e/2-advanced-examples/actions.cy.js',
          line: 58,
          column: 29,
          frame: `  56 |     // https://on.cypress.io/clear\n  57 |     cy.get(".action-select").type("Clear this text");\n> 58 |     cy.get(".action-clear").should("have.value", "Clear this text");\n     |                             ^\n  59 |     cy.get(".action-clear").clear();\n`,
        },
      },
    }

    expect(renderPlain(failed)).toMatchInlineSnapshot(`
      "✖ Actions > .clear() - clears an input  failed

      TEST BODY · r6
         1  get      .action-clear
         2  -assert  expected <input> to have value Clear this text ✖

      ✖ AssertionError
        Timed out retrying after 4000ms: expected '<input#description>' to have value 'Clear this text', but the value was ''

        cypress/e2e/2-advanced-examples/actions.cy.js:58:29
          56 |     // https://on.cypress.io/clear
          57 |     cy.get(".action-select").type("Clear this text");
        > 58 |     cy.get(".action-clear").should("have.value", "Clear this text");
             |                             ^
          59 |     cy.get(".action-clear").clear();"
    `)
  })

  it('renders an unreached test as its header and an empty-log note', () => {
    const empty: TapReporterView = {
      test: { id: 'r1', title: 'never ran', fullTitle: 'never ran', state: 'skipped' },
      hooks: [{ hookId: 'r1', hookName: 'test body' }],
      sessions: [],
      agents: [],
      routes: [],
      commands: [],
    }

    expect(renderPlain(empty)).toMatchInlineSnapshot(`
      "- never ran  skipped

      No commands were logged for this test."
    `)
  })
})

describe('lib/tap/render/reporter spec overview', () => {
  const renderSpecPlain = (input: TapReporterSpecView): string => stripAnsi(renderReporterSpecHuman(input))

  const emptyStats = { passed: 0, failed: 0, pending: 0, skipped: 0 }

  it('renders the spec header, stats, and the suite sections with per-state icons', () => {
    const view: TapReporterSpecView = {
      spec: 'cypress/e2e/actions.cy.js',
      stats: { passed: 2, failed: 1, pending: 1, skipped: 1, duration: 17400 },
      tests: [{ id: 't1', title: 'root test', state: 'passed', duration: 20 }],
      suites: [
        {
          title: 'A',
          tests: [
            { id: 't2', title: 'a1', state: 'passed', duration: 10 },
            { id: 't4', title: 'a2', state: 'pending' },
          ],
        },
        {
          title: 'A > B',
          tests: [{
            id: 't3',
            title: 'b1',
            state: 'failed',
            duration: 30,
            retries: 2,
            attempts: [
              { attempt: 1, state: 'failed', duration: 4476 },
              { attempt: 2, state: 'failed', duration: 4400 },
              { attempt: 3, state: 'failed', duration: 30 },
            ],
          }],
        },
        { title: 'C', tests: [{ id: 't5', title: 'c1', state: 'skipped' }] },
      ],
    }

    expect(renderSpecPlain(view)).toMatchInlineSnapshot(`
      "cypress/e2e/actions.cy.js
      ✓ 2  ✖ 1  ○ 1  - 1  00:17

         t1  ✓ root test  20ms

      A
         t2  ✓ a1  10ms
         t4  ○ a2

      A > B
         t3  ✖ b1  30ms  (2 retries)
               ✖ attempt 1  4.5s
               ✖ attempt 2  4.4s
               ✖ attempt 3  30ms

      C
         t5  - c1"
    `)
  })

  it('renders zero counts as -- the way the app header does', () => {
    const view: TapReporterSpecView = {
      stats: { ...emptyStats, passed: 3, duration: 900 },
      tests: [{ id: 'r1', title: 'only test', state: 'passed', duration: 4476 }],
      suites: [],
    }

    expect(renderSpecPlain(view)).toMatchInlineSnapshot(`
      "✓ 3  ✖ --  ○ --  900ms

         r1  ✓ only test  4.5s"
    `)
  })

  it('renders the run clock across the duration formats', () => {
    const clockLine = (duration?: number) => renderSpecPlain({ stats: { ...emptyStats, duration }, tests: [], suites: [] }).split('\n')[0]

    expect(clockLine(undefined)).toMatchInlineSnapshot(`"✓ --  ✖ --  ○ --  --"`)
    expect(clockLine(817)).toMatchInlineSnapshot(`"✓ --  ✖ --  ○ --  817ms"`)
    expect(clockLine(17400)).toMatchInlineSnapshot(`"✓ --  ✖ --  ○ --  00:17"`)
    expect(clockLine(3723000)).toMatchInlineSnapshot(`"✓ --  ✖ --  ○ --  1:02:03"`)
  })

  it('renders an empty spec as its header and a no-tests note', () => {
    expect(renderSpecPlain({ spec: 'cypress/e2e/empty.cy.js', stats: emptyStats, tests: [], suites: [] })).toMatchInlineSnapshot(`
      "cypress/e2e/empty.cy.js
      ✓ --  ✖ --  ○ --  --

      No tests were found in this spec."
    `)
  })
})
