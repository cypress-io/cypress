import { describe, expect, it, vi, beforeEach } from 'vitest'
import _ from 'lodash'
import { _rewriteJsUnsafe } from '../../lib/js'
import fse from 'fs-extra'
import { createRequire } from 'module'
import * as astTypes from 'ast-types'
import {
  testSourceWithExternalSourceMap,
  testSourceWithInlineSourceMap,
} from '../fixtures'

// resolve fixture libraries from node_modules (works in vitest's ESM context)
const nodeRequire = createRequire(import.meta.url)

vi.mock('ast-types', async (importActual) => {
  const actual = await importActual<typeof import('ast-types')>()

  return {
    ...actual,
    PathVisitor: {
      ...actual.PathVisitor,
      fromMethodsObject: vi.fn(),
    },
  }
})

const URL = 'http://example.com/foo.js'

function match (varName, prop) {
  return `globalThis.top.Cypress.resolveWindowReference(globalThis, ${varName}, '${prop}')`
}

function matchLocation () {
  return `globalThis.top.Cypress.resolveLocationReference(globalThis)`
}

function testExpectedJs (string: string, expected: string) {
  // use _rewriteJsUnsafe so exceptions can cause the test to fail
  const actual = _rewriteJsUnsafe(URL, string)

  expect(actual).toEqual(expected)
}

describe('js rewriter', function () {
  beforeEach(async () => {
    const { PathVisitor } = await vi.importActual<typeof import('ast-types')>('ast-types')

    vi.mocked(astTypes.PathVisitor.fromMethodsObject).mockImplementation(PathVisitor.fromMethodsObject)
  })

  describe('.rewriteJs', function () {
    describe('transformations', function () {
      describe('injects Cypress window property resolver', () => {
        [
          ['window.top', match('window', 'top')],
          ['window.parent', match('window', 'parent')],
          ['window[\'top\']', match('window', 'top')],
          ['window[\'parent\']', match('window', 'parent')],
          ['window["top"]', match('window', 'top')],
          ['window["parent"]', match('window', 'parent')],
          ['foowindow.top', match('foowindow', 'top')],
          ['foowindow[\'top\']', match('foowindow', 'top')],
          ['window.topfoo'],
          ['window[\'topfoo\']'],
          ['window[\'top\'].foo', `${match('window', 'top')}.foo`],
          ['window.top.foo', `${match('window', 'top')}.foo`],
          ['window.top["foo"]', `${match('window', 'top')}["foo"]`],
          ['window[\'top\']["foo"]', `${match('window', 'top')}["foo"]`],
          [
            'if (window["top"] != window["parent"]) run()',
            `if (${match('window', 'top')} != ${match('window', 'parent')}) run()`,
          ],
          [
            'if (top != self) run()',
            `if (${match('globalThis', 'top')} != self) run()`,
          ],
          [
            'if (window != top) run()',
            `if (window != ${match('globalThis', 'top')}) run()`,
          ],
          [
            'if (top.location != self.location) run()',
            `if (${match('top', 'location')} != ${match('self', 'location')}) run()`,
          ],
          [
            'n = (c = n).parent',
            `n = ${match('c = n', 'parent')}`,
          ],
          [
            'e.top = "0"',
            `globalThis.top.Cypress.resolveWindowReference(globalThis, e, 'top', "0")`,
          ],
          ['e.top += 0'],
          [
            'e.bottom += e.top',
            `e.bottom += ${match('e', 'top')}`,
          ],
          [
            'if (a = (e.top = "0")) { }',
            `if (a = (globalThis.top.Cypress.resolveWindowReference(globalThis, e, 'top', "0"))) { }`,
          ],
          // test that double quotes remain double-quoted
          [
            'a = "b"; window.top',
            `a = "b"; ${match('window', 'top')}`,
          ],
          ['({ top: "foo", parent: "bar" })'],
          ['top: "foo"; parent: "bar";'],
          ['top: break top'],
          ['top: continue top;'],
          [
            'function top() { window.top }; function parent(...top) { window.top }',
            `function top() { ${match('window', 'top')} }; function parent(...top) { ${match('window', 'top')} }`,
          ],
          [
            '(top, ...parent) => { window.top }',
            `(top, ...parent) => { ${match('window', 'top')} }`,
          ],
          [
            '(function top() { window.top }); (function parent(...top) { window.top })',
            `(function top() { ${match('window', 'top')} }); (function parent(...top) { ${match('window', 'top')} })`,
          ],
          [
            'top += 4',
          ],
          [
            // test that arguments are not replaced
            'function foo(location) { location.href = \'bar\' }',
          ],
          [
            // test that global variables are replaced
            'function foo(notLocation) { location.href = \'bar\' }',
            `function foo(notLocation) { ${matchLocation()}.href = \'bar\' }`,
          ],
          [
            // test that scoped declarations are not replaced
            'let location = "foo"; location.href = \'bar\'',
          ],
          [
            'location.href = "bar"',
            `${matchLocation()}.href = "bar"`,
          ],
          [
            'location = "bar"',
            `${matchLocation()}.href = "bar"`,
          ],
          [
            'window.location.href = "bar"',
            `${match('window', 'location')}.href = "bar"`,
          ],
          [
            'window.location = "bar"',
            `globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'location', "bar")`,
          ],
          [
            'document.location.href = "bar"',
            `${match('document', 'location')}.href = "bar"`,
          ],
          [
            'document.location = "bar"',
            `globalThis.top.Cypress.resolveWindowReference(globalThis, document, 'location', "bar")`,
          ],
        ]
        .forEach(([string, expected]) => {
          if (!expected) {
            expected = string
          }

          it(`${string} => ${expected}`, () => {
            testExpectedJs(string, expected)
          })
        })
      })

      it('throws an error via the driver if AST visiting throws an error', () => {
        // if astTypes.visit throws, that indicates a bug in our js-rules, and so we should stop rewriting
        const err = new Error('foo')

        err.stack = 'stack'

        vi.mocked(astTypes.PathVisitor.fromMethodsObject).mockImplementation(() => {
          throw err
        })

        const actual = _rewriteJsUnsafe(URL, 'console.log()')

        expect(actual).toMatchSnapshot()
      })

      it('replaces jira window getter', () => {
        const jira = `\
  for (; !function (n) {
    return n === n.parent
  }(n);) {}\
  `

        const jira2 = `\
  (function(n){for(;!function(l){return l===l.parent}(l)&&function(l){try{if(void 0==l.location.href)return!1}catch(l){return!1}return!0}(l.parent);)l=l.parent;return l})\
  `

        const jira3 = `\
  function satisfiesSameOrigin(w) {
      try {
          // Accessing location.href from a window on another origin will throw an exception.
          if ( w.location.href == undefined) {
              return false;
          }
      } catch (e) {
          return false;
      }
      return true;
  }

  function isTopMostWindow(w) {
      return w === w.parent;
  }

  while (!isTopMostWindow(parentOf) && satisfiesSameOrigin(parentOf.parent)) {
      parentOf = parentOf.parent;
  }\
  `

        testExpectedJs(jira, `\
  for (; !function (n) {
    return n === ${match('n', 'parent')};
  }(n);) {}\
  `)

        testExpectedJs(jira2, `\
  (function(n){for(;!function(l){return l===${match('l', 'parent')};}(l)&&function(l){try{if(void 0==${match('l', 'location')}.href)return!1}catch(l){return!1}return!0}(${match('l', 'parent')});)l=${match('l', 'parent')};return l})\
  `)

        testExpectedJs(jira3, `\
  function satisfiesSameOrigin(w) {
      try {
          // Accessing location.href from a window on another origin will throw an exception.
          if ( ${match('w', 'location')}.href == undefined) {
              return false;
          }
      } catch (e) {
          return false;
      }
      return true;
  }

  function isTopMostWindow(w) {
      return w === ${match('w', 'parent')};
  }

  while (!isTopMostWindow(parentOf) && satisfiesSameOrigin(${match('parentOf', 'parent')})) {
      parentOf = ${match('parentOf', 'parent')};
  }\
  `)
      })

      describe('libs', () => {
        // Run real-world library bundles through the rewriter to ensure it never
        // corrupts otherwise-valid JavaScript. These bundles are resolved from
        // node_modules (pinned via the lockfile) rather than downloaded from a
        // CDN at test time, so the suite is deterministic and needs no network
        // access. A mix of minified and unminified UMD/CJS bundles is used to
        // exercise a wide variety of real-world code shapes and sizes.
        const libs = {
          jquery: 'jquery/dist/jquery.js',
          jqueryMin: 'jquery/dist/jquery.min.js',
          lodash: 'lodash/lodash.js',
          lodashMin: 'lodash/lodash.min.js',
          bluebird: 'bluebird/js/release/bluebird.js',
          bluebirdMin: 'bluebird/js/browser/bluebird.min.js',
          vue: 'vue/dist/vue.global.js',
          vueMin: 'vue/dist/vue.global.prod.js',
          react: 'react/cjs/react.development.js',
          reactProd: 'react/cjs/react.production.min.js',
        }

        _.each(libs, (modulePath, lib) => {
          it(`does not corrupt code from '${lib}'`, async () => {
            // the URL is only used as a label for sourcemaps, no request is made
            const url = `http://example.com/${lib}.js`
            const libCode = await fse.readFile(nodeRequire.resolve(modulePath), 'utf8')

            const stripped = _rewriteJsUnsafe(url, libCode)

            // a successful rewrite never falls back to injecting a driver error
            expect(stripped, `rewriting '${lib}' should not fail`).not.toContain('js_rewriting_failed')

            // `new Function` compiles (but does not execute) the rewritten source,
            // so a thrown SyntaxError means the rewriter produced invalid JS
            expect(() => new Function(stripped), `rewritten '${lib}' is valid JS`).not.toThrow()
          // large bundles can take a moment to parse + reprint, hence 30s timeout
          }, 30000)
        })
      })
    })

    describe('source maps', function () {
      it('emits sourceInfo as expected', function () {
        return new Promise<void>((resolve) => {
          _rewriteJsUnsafe(URL, 'window.top', (sourceInfo) => {
            expect(sourceInfo).toMatchSnapshot()
            resolve()

            return ''
          })
        })
      })

      it('emits info about existing inline sourcemap', function () {
        return new Promise<void>((resolve) => {
          _rewriteJsUnsafe(URL, testSourceWithInlineSourceMap, (sourceInfo) => {
            expect(sourceInfo).toMatchSnapshot()
            resolve()

            return ''
          })
        })
      })

      it('emits info about existing external sourcemap', function () {
        return new Promise<void>((resolve) => {
          _rewriteJsUnsafe(URL, testSourceWithExternalSourceMap, (sourceInfo) => {
            expect(sourceInfo).toMatchSnapshot()
            resolve()

            return ''
          })
        })
      })
    })
  })
})
