import _ from 'lodash'
import { expect } from 'chai'
import { rewriteJs } from '../../lib/js'
import fse from 'fs-extra'
import Bluebird from 'bluebird'
import * as sourceMaps from '../../lib/source-maps'
import rp from '@cypress/request-promise'
import snapshot from 'snap-shot-it'
import fs from 'fs'
import nock from 'nock'

const testSource = fs.readFileSync(`${__dirname}/../fixtures/test.js`).toString()
const testSourceMap = fs.readFileSync(`${__dirname}/../fixtures/test.js.map`).toString()

const URL = 'http://example.com/foo.js'

function match (varName, prop) {
  return `globalThis.top.Cypress.resolveWindowReference(globalThis, ${varName}, '${prop}')`
}

function parse (outJs: string) {
  const smIndex = outJs.lastIndexOf('\n//# sourceMappingURL=')

  return {
    js: outJs.slice(0, smIndex),
    map: sourceMaps.tryDecodeInline(outJs),
  }
}

function testExpectedJs (string: string, expected: string) {
  const actual = parse(rewriteJs(URL, string))

  expect(actual.js).to.eq(expected)

  expect(actual.map).to.deep.include({
    file: 'foo.js (original).map',
    sourceRoot: 'http://example.com/',
  })

  expect(actual.map.sources).to.deep.eq(['foo.js (original)'])
  expect(actual.map.sourcesContent).to.deep.eq([string])

  expect(actual.map).to.have.keys('version', 'sources', 'names', 'mappings', 'file', 'sourceRoot', 'sourcesContent')
}

describe('lib/js', function () {
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
            `if ((top === globalThis['top'] ? ${match('globalThis', 'top')} : top) != self) run()`,
          ],
          [
            'if (window != top) run()',
            `if (window != (top === globalThis['top'] ? ${match('globalThis', 'top')} : top)) run()`,
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
            'const top = top; const parent = parent;',
            `const top = (top === globalThis['top'] ? ${match('globalThis', 'top')} : top); const parent = (parent === globalThis['parent'] ? ${match('globalThis', 'parent')} : parent);`,
          ],
          [
            'top += 4',
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
            // nock.enableNetConnect()

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
              const stripped = rewriteJs(url, libCode)

              expect(() => eval(stripped), 'is valid JS').to.not.throw
            })
          })
        })
      })
    })

    context('source maps', function () {
      it('generates as expected', function () {
        snapshot(parse(rewriteJs(URL, 'window.top')).map)
      })

      it('composes with existing inline sourcemap', function () {
        // replace existing sourceMappingURL with inline
        const inlinedJs = sourceMaps.inlineFormatter({
          code: testSource.replace('\n//# sourceMappingURL=test.js.map\n', ''),
          map: JSON.parse(testSourceMap),
        })

        snapshot(parse(rewriteJs('test.js', inlinedJs)).map)
      })

      // TODO: implement serving extenal sourcemaps
      context.skip('external sourcemaps', function () {
        beforeEach(() => {
          nock.disableNetConnect()
        })

        afterEach(() => {
          nock.restore()
          nock.enableNetConnect()
        })

        it('loads external sourcemaps', () => {
          // const onComplete = () => {

          // }

          // snapshot(parse(rewriteJsWithExternalSourceMaps('http://foo.com/bar/test.js', inlinedJs, onComplete)))
        })
      })
    })
  })
})
