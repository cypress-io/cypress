import _ from 'lodash'
import { expect } from 'chai'
import { _rewriteJsUnsafe } from '../../lib/js'
import fse from 'fs-extra'
import Bluebird from 'bluebird'
import rp from '@cypress/request-promise'
import snapshot from 'snap-shot-it'
import * as astTypes from 'ast-types'
import sinon from 'sinon'
import {
  testSourceWithExternalSourceMap,
  testSourceWithInlineSourceMap,
} from '../fixtures'

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

  expect(actual).to.eq(expected)
}

describe('js rewriter', function () {
  afterEach(() => {
    sinon.restore()
  })

  context('.rewriteJs', function () {
    context('transformations', function () {
      context('injects Cypress window property resolver', () => {
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

        sinon.stub(astTypes, 'visit').throws(err)

        const actual = _rewriteJsUnsafe(URL, 'console.log()')

        snapshot(actual)
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
        const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs'

        const needsDash = ['backbone', 'underscore']

        let libs = {
          jquery: `${cdnUrl}/jquery/3.3.1/jquery.js`,
          jqueryui: `${cdnUrl}/jqueryui/1.12.1/jquery-ui.js`,
          angular: `${cdnUrl}/angular.js/1.6.5/angular.js`,
          bootstrap: `${cdnUrl}/twitter-bootstrap/4.0.0/js/bootstrap.js`,
          moment: `${cdnUrl}/moment.js/2.20.1/moment.js`,
          lodash: `${cdnUrl}/lodash.js/4.17.5/lodash.js`,
          vue: `${cdnUrl}/vue/2.5.13/vue.js`,
          backbone: `${cdnUrl}/backbone.js/1.3.3/backbone.js`,
          cycle: `${cdnUrl}/cyclejs-core/7.0.0/cycle.js`,
          d3: `${cdnUrl}/d3/4.13.0/d3.js`,
          underscore: `${cdnUrl}/underscore.js/1.8.3/underscore.js`,
          foundation: `${cdnUrl}/foundation/6.4.3/js/foundation.js`,
          require: `${cdnUrl}/require.js/2.3.5/require.js`,
          rxjs: `${cdnUrl}/rxjs/5.5.6/Rx.js`,
          bluebird: `${cdnUrl}/bluebird/3.5.1/bluebird.js`,
        }

        libs = _
        .chain(libs)
        .clone()
        .reduce((memo, url, lib) => {
          memo[lib] = url
          memo[`${lib}Min`] = url
          .replace(/js$/, 'min.js')
          .replace(/css$/, 'min.css')

          if (needsDash.includes(lib)) {
            memo[`${lib}Min`] = url.replace('min', '-min')
          }

          return memo
        }
        , {})
        .extend({
          knockoutDebug: `${cdnUrl}/knockout/3.4.2/knockout-debug.js`,
          knockoutMin: `${cdnUrl}/knockout/3.4.2/knockout-min.js`,
          emberMin: `${cdnUrl}/ember.js/2.18.2/ember.min.js`,
          emberProd: `${cdnUrl}/ember.js/2.18.2/ember.prod.js`,
          reactDev: `${cdnUrl}/react/16.2.0/umd/react.development.js`,
          reactProd: `${cdnUrl}/react/16.2.0/umd/react.production.min.js`,
          vendorBundle: 'https://s3.amazonaws.com/internal-test-runner-assets.cypress.io/vendor.bundle.js',
          hugeApp: 'https://s3.amazonaws.com/internal-test-runner-assets.cypress.io/huge_app.js',
        })
        .value() as unknown as typeof libs

        _.each(libs, (url, lib) => {
          it(`does not corrupt code from '${lib}'`, function () {
            // may have to download and rewrite large files
            this.timeout(20000)

            const pathToLib = `/tmp/${lib}`

            const downloadFile = () => {
              return rp(url)
              .then((resp) => {
                return Bluebird.fromCallback((cb) => {
                  fse.writeFile(pathToLib, resp, cb)
                })
                .return(resp)
              })
            }

            return fse
            .readFile(pathToLib, 'utf8')
            .catch(downloadFile)
            .then((libCode) => {
              const stripped = _rewriteJsUnsafe(url, libCode)

              expect(() => eval(stripped), 'is valid JS').to.not.throw
            })
          })
        })
      })
    })

    context('source maps', function () {
      it('emits sourceInfo as expected', function (done) {
        _rewriteJsUnsafe(URL, 'window.top', (sourceInfo) => {
          snapshot(sourceInfo)
          done()

          return ''
        })
      })

      it('emits info about existing inline sourcemap', function (done) {
        _rewriteJsUnsafe(URL, testSourceWithInlineSourceMap, (sourceInfo) => {
          snapshot(sourceInfo)
          done()

          return ''
        })
      })

      it('emits info about existing external sourcemap', function (done) {
        _rewriteJsUnsafe(URL, testSourceWithExternalSourceMap, (sourceInfo) => {
          snapshot(sourceInfo)
          done()

          return ''
        })
      })
    })
  })
})
