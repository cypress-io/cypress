import { afterEach, describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderConsolePropsHuman } from '../../../lib/tap/render/console-props'
import type { ConsolePropsOptions } from '../../../lib/tap/render/console-props'
import type { TapConsoleProps } from '@packages/cypress-instances'

// chalk's color level depends on where the suite runs, so strip any escape
// codes before snapshotting — the assertions target the layout, not the colors.
const renderProps = (props: TapConsoleProps, options: ConsolePropsOptions = {}): string => {
  return stripAnsi(renderConsolePropsHuman(props, options))
}

// The payload shape the deep commands return: a request nested under its
// matcher, with the header map that makes it pages long when opened whole. Deep
// and wide enough to show both folds at the default — `headers` for its size,
// `body` for its depth.
const REQUEST: TapConsoleProps = {
  name: 'request',
  type: 'event',
  props: {
    'Resource Type': 'xhr',
    'Method': 'POST',
    'URL': 'https://jsonplaceholder.cypress.io/comments',
    'Matched `cy.intercept()`': {
      RouteMatcher: { method: 'POST', url: '**/comments' },
      'RouteHandler Type': 'Spy',
      Request: {
        headers: Object.fromEntries(Array.from({ length: 14 }, (_value, index) => [`header-${index + 1}`, 'value'])),
        url: 'https://jsonplaceholder.cypress.io/comments',
        method: 'POST',
      },
      Response: {
        headers: { date: 'Thu, 30 Jul 2026 18:44:46 GMT', 'content-type': 'application/json; charset=utf-8' },
        statusCode: 201,
        body: { comment: { id: 501, name: 'Using POST in cy.intercept()' } },
      },
    },
    'Alias': 'postComment',
  },
}

describe('lib/tap/render/console-props', () => {
  // The one case the terminal width is observable in: a value with no room left.
  const setColumns = (columns: number | undefined) => {
    Object.defineProperty(process.stdout, 'columns', { value: columns, configurable: true })
  }

  afterEach(() => setColumns(undefined))

  describe('depth', () => {
    it('expands three levels, folds what is deeper or oversized, and names the ways to open it', () => {
      expect(renderProps(REQUEST)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request  (event)
          Resource Type  xhr
          Method         POST
          URL            https://jsonplaceholder.cypress.io/comments
          Matched \`cy.intercept()\`
            RouteMatcher
              method  POST
              url     **/comments
            RouteHandler Type  Spy
            Request
              headers  {14 keys}
              url      https://jsonplaceholder.cypress.io/comments
              method   POST
            Response
              headers
                date          Thu, 30 Jul 2026 18:44:46 GMT
                content-type  application/json; charset=utf-8
              statusCode  201
              body
                comment  {2 keys}
          Alias          postComment

        2 sections collapsed — open one with --path "Matched \`cy.intercept()\`>Request>headers", or all of it with --depth all"
      `)
    })

    it('stops at the level --depth names', () => {
      expect(renderProps(REQUEST, { depth: '2' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request  (event)
          Resource Type  xhr
          Method         POST
          URL            https://jsonplaceholder.cypress.io/comments
          Matched \`cy.intercept()\`
            RouteMatcher
              method  POST
              url     **/comments
            RouteHandler Type  Spy
            Request
              headers  {14 keys}
              url      https://jsonplaceholder.cypress.io/comments
              method   POST
            Response
              headers     {2 keys}
              statusCode  201
              body        {1 key}
          Alias          postComment

        3 sections collapsed — open one with --path "Matched \`cy.intercept()\`>Request>headers", or all of it with --depth all"
      `)
    })

    it('expands everything for --depth all, collapsing nothing', () => {
      expect(renderProps(REQUEST, { depth: 'all' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request  (event)
          Resource Type  xhr
          Method         POST
          URL            https://jsonplaceholder.cypress.io/comments
          Matched \`cy.intercept()\`
            RouteMatcher
              method  POST
              url     **/comments
            RouteHandler Type  Spy
            Request
              headers
                header-1   value
                header-2   value
                header-3   value
                header-4   value
                header-5   value
                header-6   value
                header-7   value
                header-8   value
                header-9   value
                header-10  value
                header-11  value
                header-12  value
                header-13  value
                header-14  value
              url     https://jsonplaceholder.cypress.io/comments
              method  POST
            Response
              headers
                date          Thu, 30 Jul 2026 18:44:46 GMT
                content-type  application/json; charset=utf-8
              statusCode  201
              body
                comment
                  id    501
                  name  Using POST in cy.intercept()
          Alias          postComment"
      `)
    })

    it('summarizes every container for --depth 0', () => {
      expect(renderProps(REQUEST, { depth: '0' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request  (event)
          Resource Type             xhr
          Method                    POST
          URL                       https://jsonplaceholder.cypress.io/comments
          Matched \`cy.intercept()\`  {4 keys}
          Alias                     postComment

        1 section collapsed — open one with --path "Matched \`cy.intercept()\`", or all of it with --depth all"
      `)
    })

    // A header map buries whatever sits around it, so the default view folds a
    // long section however shallow it is; an explicit --depth is taken literally.
    it('folds an oversized section by default and expands it when --depth asks', () => {
      const headers = Object.fromEntries(Array.from({ length: 12 }, (_value, index) => [`header-${index + 1}`, 'value']))
      const envelope: TapConsoleProps = { name: 'request', type: 'command', props: { 'Request Headers': headers, Alias: 'postComment' } }

      expect(renderProps(envelope)).toContain('Request Headers  {12 keys}')
      expect(renderProps(envelope, { depth: '1' })).toContain('header-12')
    })

    it('notes an unreadable --depth rather than silently choosing one', () => {
      expect(renderProps(REQUEST, { depth: 'deep' })).toContain('--depth takes a whole number or "all"')
    })
  })

  describe('path', () => {
    it('shows one section, breadcrumbed, matching keys case-insensitively by prefix', () => {
      expect(renderProps(REQUEST, { path: 'matched `cy.intercept()`>resp>head' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request  (event) › Matched \`cy.intercept()\` › Response › headers
          date          Thu, 30 Jul 2026 18:44:46 GMT
          content-type  application/json; charset=utf-8"
      `)
    })

    it('prints a scalar at an explicit path in full', () => {
      expect(renderProps(REQUEST, { path: 'URL' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request  (event) › URL
          https://jsonplaceholder.cypress.io/comments"
      `)
    })

    it('reaches an envelope section beside props by name', () => {
      const envelope: TapConsoleProps = {
        name: 'get',
        type: 'command',
        props: { Selector: '.missing' },
        error: 'AssertionError: Timed out retrying\n  at Context.eval (webpack://spec.cy.js:4:1)',
      }

      expect(renderProps(envelope, { path: 'error' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · get › error
          AssertionError: Timed out retrying
            at Context.eval (webpack://spec.cy.js:4:1)"
      `)
    })

    it('lists the keys that are there when a segment matches nothing', () => {
      expect(renderProps(REQUEST, { path: 'Matched `cy.intercept()`>Requesting' })).toMatchInlineSnapshot(`
        "No console property named "Requesting" under "Matched \`cy.intercept()\`".
        Keys here: RouteMatcher, RouteHandler Type, Request, Response"
      `)
    })

    // Several keys can share a prefix, and guessing between them would send back
    // a payload that isn't the one asked for.
    it('names the candidates when a segment matches more than one key', () => {
      const envelope: TapConsoleProps = {
        name: 'request',
        type: 'command',
        props: { 'Response Status Code': 201, 'Response Headers': { date: 'now' }, 'Response Body': { id: 501 } },
      }

      expect(renderProps(envelope, { path: 'response' })).toMatchInlineSnapshot(`
        ""response" matches more than one key.
        Name one of: Response Status Code, Response Headers, Response Body"
      `)
    })

    it('says so when a path walks into a value', () => {
      expect(renderProps(REQUEST, { path: 'Method>deeper' })).toMatchInlineSnapshot(`""Method" is a value, not a section — there is nothing under it to reach with "deeper"."`)
    })
  })

  // What a real payload can carry that the layout has to survive: bytes from a
  // server, keys that were never meant as labels, sections that hold nothing.
  describe('hostile payloads', () => {
    it('keeps a value with tabs, carriage returns and escape codes on one row', () => {
      const envelope: TapConsoleProps = {
        name: 'request',
        type: 'command',
        props: { tabbed: 'a\tb\tc', tinted: '[31mred[39m', crlf: 'first\r\nsecond' },
      }

      expect(renderProps(envelope)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request
          tabbed  a b c
          tinted  red
          crlf
            first
            second"
      `)
    })

    it('collapses a multi-line key onto its row and clamps a key that would own the level', () => {
      const envelope: TapConsoleProps = {
        name: 'x',
        type: 'command',
        props: { 'line one\nline two': 'v', [`k${'y'.repeat(60)}`]: 'value', short: 1 },
      }

      expect(renderProps(envelope)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · x
          line one line two                 v
          kyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy…  value
          short                             1"
      `)
    })

    it('states the emptiness of a section that holds nothing', () => {
      expect(renderProps({ name: 'log', type: 'command', props: {} })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · log
          (nothing here)"
      `)

      expect(renderProps({ name: 'x', type: 'command', props: { Options: {} } }, { path: 'Options' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · x › Options
          (nothing here)"
      `)
    })

    it('marks an empty string and an empty key rather than leaving a blank row', () => {
      const envelope: TapConsoleProps = { name: 'x', type: 'command', props: { blank: '', '': { deep: 1 } } }

      expect(renderProps(envelope)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · x
          blank  (empty string)
          (empty key)
            deep  1"
      `)
    })

    it('summarizes a huge array and reaches an index through --path', () => {
      const big: TapConsoleProps = { name: 'x', type: 'command', props: { items: Array.from({ length: 2000 }, (_value, index) => index) } }

      expect(renderProps(big)).toContain('items  {2000 items}')
      expect(renderProps({ name: 'x', type: 'command', props: { items: ['a', 'b', 'c'] } }, { path: 'items>2' })).toContain('b')
    })

    it('folds a runaway nesting at the default depth', () => {
      const deep: Record<string, unknown> = { level: 0 }
      let node = deep

      for (let level = 1; level < 40; level++) {
        node.next = { level }
        node = node.next as Record<string, unknown>
      }

      const rendered = renderProps({ name: 'x', type: 'command', props: deep as TapConsoleProps['props'] })

      expect(rendered.split('\n')).to.have.length.lessThan(12)
      expect(rendered).toContain('--path "next>next>next>next"')
    })
  })

  it('clamps a value to the room left on its row so the column holds', () => {
    setColumns(60)

    expect(renderProps(REQUEST, { depth: '0' })).toMatchInlineSnapshot(`
      "CONSOLE PROPS · request  (event)
        Resource Type             xhr
        Method                    POST
        URL                       https://jsonplaceholder.cypress…
        Matched \`cy.intercept()\`  {4 keys}
        Alias                     postComment

      1 section collapsed — open all of it with --depth all, or one with:
        --path "Matched \`cy.intercept()\`""
    `)
  })

  // The driver wraps a log's console properties in a `{ name, type, props }`
  // envelope, with table/error/snapshot as siblings of `props` (log.ts
  // wrapConsoleProps) — these fixtures mirror payloads the live binding returns.
  describe('envelope', () => {
    it('lifts props out of the envelope to the top level, aligned per nesting level', () => {
      const envelope: TapConsoleProps = {
        name: 'request',
        type: 'command',
        props: {
          Request: {
            'Request URL': 'https://jsonplaceholder.cypress.io/comments?postId=1&id=3',
            'Request Headers': { accept: '*/*', 'accept-encoding': 'gzip, deflate' },
            'Response Status': 200,
          },
          Yielded: {
            status: 200,
            duration: 132,
            body: '[12,345 characters withheld — pass --full-report to include it]',
          },
        },
      }

      expect(renderProps(envelope, { depth: 'all' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request
          Request
            Request URL      https://jsonplaceholder.cypress.io/comments?postId=1&id=3
            Request Headers
              accept           */*
              accept-encoding  gzip, deflate
            Response Status  200
          Yielded
            status    200
            duration  132
            body      [12,345 characters withheld — pass --full-report to include it]"
      `)
    })

    // A response body or stack trace would otherwise break the aligned column.
    it('renders a multi-line string as a block under its key', () => {
      const envelope: TapConsoleProps = {
        name: 'request',
        type: 'command',
        props: { 'Response Body': '[\n  {\n    "id": 3\n  }\n]', 'Response Status': 200 },
      }

      expect(renderProps(envelope)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · request
          Response Body
            [
              {
                "id": 3
              }
            ]
          Response Status  200"
      `)
    })

    it('renders each logged table as its own section, row keys as columns', () => {
      const envelope: TapConsoleProps = {
        name: 'type',
        type: 'command',
        props: { Typed: 'hi', 'Applied To': '<input id="name">' },
        table: {
          2: {
            name: 'Keyboard Events',
            data: [
              { Typed: 'h', 'Target Element': '<input id="name">', 'Events Fired': 'keydown, keypress, textInput, input, keyup', Details: '{ code: KeyH, which: 72 }' },
              { Typed: 'i', 'Target Element': '<input id="name">', 'Events Fired': 'keydown, keypress, textInput, input, keyup', Details: '{ code: KeyI, which: 73 }' },
            ],
          },
        },
      }

      expect(renderProps(envelope)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · type
          Typed       hi
          Applied To  <input id="name">

        KEYBOARD EVENTS (2)
          Typed  Target Element     Events Fired                              Details
          h      <input id="name">  keydown, keypress, textInput, input, ke…  { code: KeyH, which: 72 }
          i      <input id="name">  keydown, keypress, textInput, input, ke…  { code: KeyI, which: 73 }"
      `)
    })

    it('renders envelope error and snapshot notes as their own sections', () => {
      const envelope: TapConsoleProps = {
        name: 'get',
        type: 'command',
        props: { Selector: '.missing' },
        error: 'AssertionError: Timed out retrying\n  at Context.eval (webpack://spec.cy.js:4:1)',
        snapshot: 'The snapshot is missing. Displaying current state of the DOM.',
      }

      expect(renderProps(envelope)).toMatchInlineSnapshot(`
        "CONSOLE PROPS · get
          Selector  .missing

        ERROR
          AssertionError: Timed out retrying
            at Context.eval (webpack://spec.cy.js:4:1)

        SNAPSHOT
          The snapshot is missing. Displaying current state of the DOM."
      `)
    })

    // A lone row carries no comparison, so it reads better as plain key/values.
    it('numbers array entries and leaves a single-row array untabled', () => {
      const envelope: TapConsoleProps = {
        name: 'its',
        type: 'command',
        props: {
          Subject: [{ postId: 1, id: 3, email: 'Nikita@garfield.biz' }],
          Aliases: ['getComment', 'putComment'],
          Options: {},
          Matches: [],
          Message: null,
        },
      }

      expect(renderProps(envelope, { depth: 'all' })).toMatchInlineSnapshot(`
        "CONSOLE PROPS · its
          Subject
            1
              postId  1
              id      3
              email   Nikita@garfield.biz
          Aliases
            1  getComment
            2  putComment
          Options  {}
          Matches  []
          Message  null"
      `)
    })

    // What the driver returns in place of an evicted command's details: no envelope.
    it('renders an envelope-less payload as it arrives', () => {
      const payload: TapConsoleProps = { Message: 'The command details and snapshot has been cleaned up to reduce the number of tests in memory.' }

      expect(renderProps(payload)).toMatchInlineSnapshot(`
        "CONSOLE PROPS
          Message  The command details and snapshot has been cleaned up to reduce the number of tests in memory."
      `)
    })

    it('reports an empty payload rather than rendering an empty panel', () => {
      expect(renderProps({})).toMatchInlineSnapshot(`"This command logged no console properties."`)
    })
  })
})
