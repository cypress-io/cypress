import { describe, expect, it } from 'vitest'

import { renderReporterHuman } from '../../../lib/tap/render/reporter'
import type { TapReporterView } from '@packages/cypress-instances'

// chalk's color level depends on where the suite runs, so strip any escape
// codes before snapshotting — the assertions target the layout, not the colors.
// eslint-disable-next-line no-control-regex
const stripAnsi = (text: string): string => text.replace(/\[\d+m/g, '')

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
  routes: [
    { id: 'log-60', method: 'GET', url: '**/comments/*', stubbed: false, numResponses: 1, alias: 'getComment' },
    { id: 'log-77', method: 'PUT', url: '**/comments/*', stubbed: true, status: 404, numResponses: 1, alias: 'putComment' },
  ],
  commands: [
    { id: 'log-59', name: 'visit', message: 'http://localhost:8080/commands/network-requests', state: 'passed', type: 'parent', hookId: 'h1' },
    { id: 'log-61', name: 'get', message: '.network-btn', state: 'passed', type: 'parent', hookId: 'r8' },
    { id: 'log-62', name: 'click', message: '', state: 'passed', type: 'child', hookId: 'r8' },
    {
      id: 'log-63', name: 'request', displayName: 'xhr', message: 'GET 200 https://jsonplaceholder.cypress.io/comments/1',
      state: 'passed', type: 'parent', hookId: 'r8', event: true,
      network: { method: 'GET', url: 'https://jsonplaceholder.cypress.io/comments/1', indicator: 'successful', stubbed: false, alias: 'getComment' },
    },
    { id: 'log-64', name: 'wait', message: '@getComment', state: 'passed', type: 'parent', hookId: 'r8' },
    { id: 'log-66', name: 'assert', message: 'expected **200** to be one of **[ 200, 304 ]**', state: 'passed', type: 'child', hookId: 'r8' },
    {
      id: 'log-80', name: 'request', displayName: 'xhr', message: 'PUT 404 https://jsonplaceholder.cypress.io/comments/1',
      state: 'passed', type: 'parent', hookId: 'r8', event: true,
      network: { method: 'PUT', url: 'https://jsonplaceholder.cypress.io/comments/1', indicator: 'bad', stubbed: true, alias: 'putComment' },
    },
    { id: 'log-82', name: 'get', message: '.network-put-comment', state: 'failed', type: 'parent', hookId: 'r8' },
    { id: 'log-83', name: 'session', message: 'user', state: 'passed', type: 'parent', hookId: 'r8', group: 'log-82', groupLevel: 1 },
  ],
}

describe('lib/tap/render/reporter', () => {
  it('renders the reporter panel: header, routes table, hook sections, numbered commands, event annotations', () => {
    expect(renderPlain(view)).toMatchInlineSnapshot(`
      "✓ Network Requests > cy.intercept() - route responses to matching requests  passed

      ROUTES (2)
        METHOD  MATCHER        STUBBED  ALIAS        #
        GET     **/comments/*  no       @getComment  1
        PUT     **/comments/*  yes      @putComment  1

      BEFORE EACH
        1  visit  http://localhost:8080/commands/network-requests

      TEST BODY
        1  get      .network-btn
        2  -click
             (xhr) ● GET 200 https://jsonplaceholder.cypress.io/comments/1  @getComment
        3  wait     @getComment
        4  -assert  expected 200 to be one of [ 200, 304 ]
             (xhr) ● PUT 404 https://jsonplaceholder.cypress.io/comments/1  @putComment (stubbed)
        5  get      .network-put-comment ✖
        6    session  user"
    `)
  })

  it('renders the error panel — name, message, and marked code frame — for a failed test', () => {
    const failed: TapReporterView = {
      test: { id: 'r6', title: '.clear() - clears an input', fullTitle: 'Actions > .clear() - clears an input', state: 'failed' },
      hooks: [{ hookId: 'r6', hookName: 'test body' }],
      routes: [],
      commands: [
        { id: 'log-1', name: 'get', message: '.action-clear', state: 'passed', type: 'parent', hookId: 'r6' },
        { id: 'log-2', name: 'assert', message: 'expected **<input>** to have value **Clear this text**', state: 'failed', type: 'child', hookId: 'r6' },
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

      TEST BODY
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
      routes: [],
      commands: [],
    }

    expect(renderPlain(empty)).toMatchInlineSnapshot(`
      "- never ran  skipped

      No commands were logged for this test."
    `)
  })
})
