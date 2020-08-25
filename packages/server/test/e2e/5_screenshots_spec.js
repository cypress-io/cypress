const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const Fixtures = require('../support/helpers/fixtures')
const e2e = require('../support/helpers/e2e').default
let sizeOf = require('image-size')
let fs = require('../../lib/util/fs')

fs = Promise.promisifyAll(fs)
sizeOf = Promise.promisify(sizeOf)

const e2ePath = Fixtures.projectPath('e2e')

const onServer = function (app) {
  app.get('/color/:color', (req, res) => {
    return e2e.sendHtml(`\
<style>body { margin: 0; }</style>
<div style="height: 2000px; width: 2000px; background-color: ${req.params.color};"></div>`)(req, res)
  })

  app.get('/fullPage', e2e.sendHtml(`\
<style>body { margin: 0; }</style>
<div style="background: white; height: 200px;"></div>
<div style="background: black; height: 200px;"></div>
<div style="background: white; height: 100px;"></div>\
`))

  app.get('/fullPage-same', e2e.sendHtml(`\
<style>body { margin: 0; }</style>
<div style="height: 500px;"></div>\
`))

  app.get('/element', e2e.sendHtml(`\
<div class="element" style="background: red; width: 400px; height: 300px; margin: 20px;"></div>\
`))

  app.get('/pathological', e2e.sendHtml(`\
<style>div { width: 1px; height: 1px; position: fixed; }</style>
<div style="left: 0; top: 0; background-color: grey;"></div>
<div style="left: 1px; top: 0; background-color: white;"></div>
<div style="left: 0; top: 1px; background-color: white;"></div>
<div style="right: 0; top: 0; background-color: white;"></div>
<div style="left: 0; bottom: 0; background-color: white;"></div>
<div style="right: 0; bottom: 0; background-color: black;"></div>\
`))

  return app.get('/identical', e2e.sendHtml(`\
<style>div { height: 1300px; width: 200px; background-color: #ddd; }</style>
<div></div>\
`))
}

describe('e2e screenshots', () => {
  e2e.setup({
    servers: {
      port: 3322,
      onServer,
    },
  })

  // this tests that screenshots can be manually generated
  // and are also generated automatically on failure with
  // the test title as the file name
  e2e.it('passes', {
    spec: 'screenshots_spec.js',
    expectedExitCode: 5,
    snapshot: true,
    timeout: 180000,
    onStdout: e2e.normalizeWebpackErrors,
    onRun (exec, browser) {
      return exec()
      .then(() => {
        const screenshot = (...paths) => {
          return path.join(e2ePath, 'cypress', 'screenshots', 'screenshots_spec.js', ...paths)
        }

        const screenshot1 = screenshot('black.png')
        const screenshot2 = screenshot('red.png')
        const screenshot3 = screenshot('foo', 'bar', 'baz.png')
        const screenshot4 = screenshot('taking screenshots -- generates pngs on failure (failed).png')
        const screenshot5 = screenshot('taking screenshots -- before hooks -- empty test 1 -- before all hook (failed).png')
        const screenshot6 = screenshot('taking screenshots -- each hooks -- empty test 2 -- before each hook (failed).png')
        const screenshot7 = screenshot('taking screenshots -- each hooks -- empty test 2 -- after each hook (failed).png')
        const screenshot8 = screenshot('taking screenshots -- ensures unique paths when there\'s a non-named screenshot and a failure.png')
        const screenshot9 = screenshot('taking screenshots -- ensures unique paths when there\'s a non-named screenshot and a failure (failed).png')

        return Promise.all([
          fs.statAsync(screenshot1).get('size'),
          fs.statAsync(screenshot2).get('size'),
          fs.statAsync(screenshot3).get('size'),
          fs.statAsync(screenshot4).get('size'),
          fs.statAsync(screenshot5).get('size'),
          fs.statAsync(screenshot6).get('size'),
          fs.statAsync(screenshot7).get('size'),
          fs.statAsync(screenshot8).get('size'),
          fs.statAsync(screenshot9).get('size'),
        ])
        .then((sizes) => {
          // make sure all of the values are unique
          expect(sizes).to.deep.eq(_.uniq(sizes))

          // png1 should not be within 5k of png2
          expect(sizes[0]).not.to.be.closeTo(sizes[1], 5000)
        }).then(() => {
          return Promise.all([
            sizeOf(screenshot1),
            sizeOf(screenshot2),
            sizeOf(screenshot3),
            sizeOf(screenshot4),
            sizeOf(screenshot5),
            sizeOf(screenshot6),
            sizeOf(screenshot7),
          ])
        }).then((dimensions = []) => {
          if (browser === 'electron') {
            // all of the images should be 1280x720
            // since thats what we run headlessly
            return _.each(dimensions, (dimension) => {
              expect(dimension).to.deep.eq({ width: 1280, height: 720, type: 'png' })
            })
          }
        })
      })
    },
  })
})
