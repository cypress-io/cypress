import _ from 'lodash'
import { concatStream } from '@packages/network'
import { expect } from 'chai'
import fse from 'fs-extra'
import Promise from 'bluebird'
import rp from '@cypress/request-promise'
import * as security from '../../../../lib/http/util/security'

const original = `\
<html>
  <body>
    top1
    settop
    settopbox
    parent1
    grandparent
    grandparents
    topFoo
    topFoo.window
    topFoo.window != topFoo
    parentFoo
    parentFoo.window
    parentFoo.window != parentFoo

    <div style="left: 1500px; top: 0px;"></div>
    <div style="left: 1500px; top : 0px;"></div>
    <div style="left: 1500px; top  : 0px;"></div>

    parent()
    foo.parent()
    top()
    foo.top()
    foo("parent")
    foo("top")

    const parent = () => { bar: 'bar' }

    parent.bar

    <script type="text/javascript">
      if (top != self) run()
      if (top!=self) run()
      if (self !== top) run()
      if (self!==top) run()
      if (self === top) return
      if (top.location!=self.location&&(top.location.href=self.location.href)) run()
      if (top.location != self.location) run()
      if (top.location != location) run()
      if (self.location != top.location) run()
      if (parent.frames.length > 0) run()
      if (window != top) run()
      if (window.top !== window.self) run()
      if (window.top!==window.self) run()
      if (window.self != window.top) run()
      if (window.top != window.self) run()
      if (window["top"] != window["parent"]) run()
      if (window['top'] != window['parent']) run()
      if (window["top"] != self['parent']) run()
      if (parent && parent != window) run()
      if (parent && parent != self) run()
      if (parent && window != parent) run()
      if (parent && self != parent) run()
      if (parent && parent.frames && parent.frames.length > 0) run()
      if ((self.parent && !(self.parent === self)) && (self.parent.frames.length != 0)) run()
      if (parent !== null && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (null !== parent && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (top===self) return
      if (top==self) return
    </script>
  </body>
</html>\
`

const expected = `\
<html>
  <body>
    top1
    settop
    settopbox
    parent1
    grandparent
    grandparents
    topFoo
    topFoo.window
    topFoo.window != topFoo
    parentFoo
    parentFoo.window
    parentFoo.window != parentFoo

    <div style="left: 1500px; top: 0px;"></div>
    <div style="left: 1500px; top : 0px;"></div>
    <div style="left: 1500px; top  : 0px;"></div>

    parent()
    foo.parent()
    top()
    foo.top()
    foo("parent")
    foo("top")

    const parent = () => { bar: 'bar' }

    parent.bar

    <script type="text/javascript">
      if ((top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top) != self) run()
      if ((top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)!=self) run()
      if (self !== (top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)) run()
      if (self!==(top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)) run()
      if (self === (top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)) return
      if (window.top.Cypress.resolveWindowReference(window, top, 'location')!=window.top.Cypress.resolveWindowReference(window, self, 'location')&&(window.top.Cypress.resolveWindowReference(window, top, 'location').href=window.top.Cypress.resolveWindowReference(window, self, 'location').href)) run()
      if (window.top.Cypress.resolveWindowReference(window, top, 'location') != window.top.Cypress.resolveWindowReference(window, self, 'location')) run()
      if (window.top.Cypress.resolveWindowReference(window, top, 'location') != location) run()
      if (window.top.Cypress.resolveWindowReference(window, self, 'location') != window.top.Cypress.resolveWindowReference(window, top, 'location')) run()
      if (window.top.Cypress.resolveWindowReference(window, parent, 'frames').length > 0) run()
      if (window != (top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)) run()
      if (window.top.Cypress.resolveWindowReference(window, window, 'top') !== window.self) run()
      if (window.top.Cypress.resolveWindowReference(window, window, 'top')!==window.self) run()
      if (window.self != window.top.Cypress.resolveWindowReference(window, window, 'top')) run()
      if (window.top.Cypress.resolveWindowReference(window, window, 'top') != window.self) run()
      if (window.top.Cypress.resolveWindowReference(window, window, 'top') != window.top.Cypress.resolveWindowReference(window, window, 'parent')) run()
      if (window.top.Cypress.resolveWindowReference(window, window, 'top') != window.top.Cypress.resolveWindowReference(window, window, 'parent')) run()
      if (window.top.Cypress.resolveWindowReference(window, window, 'top') != window.top.Cypress.resolveWindowReference(window, self, 'parent')) run()
      if (parent && (parent === window['parent'] ? window.top.Cypress.resolveWindowReference(window, window, 'parent') : parent) != window) run()
      if (parent && (parent === window['parent'] ? window.top.Cypress.resolveWindowReference(window, window, 'parent') : parent) != self) run()
      if (parent && window != (parent === window['parent'] ? window.top.Cypress.resolveWindowReference(window, window, 'parent') : parent)) run()
      if (parent && self != (parent === window['parent'] ? window.top.Cypress.resolveWindowReference(window, window, 'parent') : parent)) run()
      if (parent && window.top.Cypress.resolveWindowReference(window, parent, 'frames') && window.top.Cypress.resolveWindowReference(window, parent, 'frames').length > 0) run()
      if ((window.top.Cypress.resolveWindowReference(window, self, 'parent') && !(window.top.Cypress.resolveWindowReference(window, self, 'parent') === self)) && (window.top.Cypress.resolveWindowReference(window, self.parent, 'frames').length != 0)) run()
      if ((parent === window['parent'] ? window.top.Cypress.resolveWindowReference(window, window, 'parent') : parent) !== null && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (null !== (parent === window['parent'] ? window.top.Cypress.resolveWindowReference(window, window, 'parent') : parent) && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if ((top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)===self) return
      if ((top === window['top'] ? window.top.Cypress.resolveWindowReference(window, window, 'top') : top)==self) return
    </script>
  </body>
</html>\
`

function match (varName, prop) {
  return `window.top.Cypress.resolveWindowReference(window, ${varName}, '${prop}')`
}

describe('http/util/security', () => {
  context('.strip', () => {
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
          `if ((top === window['top'] ? ${match('window', 'top')} : top) != self) run()`,
        ],
        [
          'if (window != top) run()',
          `if (window != (top === window['top'] ? ${match('window', 'top')} : top)) run()`,
        ],
        [
          'if (top.location != self.location) run()',
          `if (${match('top', 'location')} != ${match('self', 'location')}) run()`,
        ],
        // fun construct found in Apple's analytics code
        [
          'n = (c = n).parent',
          `n = ${match('c = n', 'parent')}`,
        ],
        // more apple goodness - `e` is an element
        [
          'e.top = "0"',
          `window.top.Cypress.resolveWindowReference(window, e, 'top', "0")`,
        ],
        [
          'if (a = (e.top = "0")) { }',
          `if (a = (window.top.Cypress.resolveWindowReference(window, e, 'top', "0"))) { }`,
        ],
        // test that double quotes remain double-quoted
        [
          'a = "b"; window.top',
          `a = "b"; ${match('window', 'top')}`,
        ],
      ]
      // .slice(0, 1)
      .forEach(([string, expected]) => {
        if (!expected) {
          expected = string
        }

        it(`${string} => ${expected}`, () => {
          const actual = security.strip(string)

          expect(actual).to.eq(expected)
        })
      })
    })

    it('replaces obstructive code', () => {
      expect(security.strip(original, { isHtml: true })).to.eq(expected)
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

      expect(security.strip(jira)).to.eq(`\
for (; !function (n) {
  return n === ${match('n', 'parent')};
}(n);) {}\
`)

      expect(security.strip(jira2)).to.eq(`\
(function(n){for(;!function(l){return l===${match('l', 'parent')};}(l)&&function(l){try{if(void 0==${match('l', 'location')}.href)return!1}catch(l){return!1}return!0}(${match('l', 'parent')});)l=${match('l', 'parent')};return l})\
`)

      expect(security.strip(jira3)).to.eq(`\
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

    // TODO: needs to be updated
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
        // NOTE: fontawesome/normalize are css, new rewriter won't intercept CSS
        // fontawesome: `${cdnUrl}/font-awesome/4.7.0/css/font-awesome.css`,
        // normalize: `${cdnUrl}/normalize/8.0.0/normalize.css`,
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
              return Promise.fromCallback((cb) => {
                fse.writeFile(pathToLib, resp, cb)
              })
              .return(resp)
            })
          }

          return fse
          .readFile(pathToLib, 'utf8')
          .catch(downloadFile)
          .then((libCode) => {
            const stripped = security.strip(libCode)

            expect(() => eval(stripped), 'is valid JS').to.not.throw

            return new Promise((resolve, reject) => {
              fse.createReadStream(pathToLib, { encoding: 'utf8' })
              .on('error', reject)
              .pipe(security.stripStream())
              .on('error', reject)
              .pipe(concatStream({ encoding: 'string' }, resolve))
              .on('error', reject)
            })
            .then((streamStripped) => {
              expect(streamStripped, 'streamed version matches nonstreamed version').to.eq(stripped)
            })
          })
        })
      })
    })

    // context('.stripStream', () => {
    //   it('replaces obstructive code', (done) => {
    //     const lines = original.split('\n')

    //     const replacer = security.stripStream({ isHtml: true })

    //     replacer.pipe(concatStream({ encoding: 'string' }, (str) => {
    //       const actual = str.toString().trim()

    //       expect(actual).to.eq(expected)

    //       done()
    //     }))

    //     lines.forEach((line) => {
    //       replacer.write(line)
    //     })

    //     replacer.end()
    //   })
  })
})
