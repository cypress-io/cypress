const path = require('path')
const fs = require('../../lib/util/fs')
const glob = require('../../lib/util/glob')
const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

const mochaAwesomes = [
  'mochawesome-1.5.2',
  'mochawesome-2.3.1',
  'mochawesome-3.0.1',
]

describe('e2e reporters', () => {
  e2e.setup()

  it('reports error if cannot load reporter', function () {
    return e2e.exec(this, {
      spec: 'simple_passing_spec.coffee',
      snapshot: true,
      expectedExitCode: 1,
      reporter: 'module-does-not-exist',
    })
  })

  // https://github.com/cypress-io/cypress/issues/1192
  it('reports error when thrown from reporter', function () {
    return e2e.exec(this, {
      spec: 'simple_passing_spec.coffee',
      snapshot: true,
      expectedExitCode: 1,
      reporter: 'reporters/throws.js',
    })
  })

  it('supports junit reporter and reporter options', function () {
    return e2e.exec(this, {
      spec: 'simple_passing_spec.coffee',
      snapshot: true,
      reporter: 'junit',
      reporterOptions: 'mochaFile=junit-output/result.[hash].xml,testCaseSwitchClassnameAndName=true',
    })
    .then(() => {
      return glob(path.join(e2ePath, 'junit-output', 'result.*.xml'))
      .then((paths) => {
        expect(paths.length).to.eq(1)

        return fs.readFileAsync(paths[0], 'utf8')
        .then((str) => {
          expect(str).to.include('<testsuite name="simple passing spec"')
          expect(str).to.include('<testcase name="passes"')

          expect(str).to.include('classname="simple passing spec passes"')
        })
      })
    })
  })

  it('supports local custom reporter', function () {
    return e2e.exec(this, {
      spec: 'simple_passing_spec.coffee',
      snapshot: true,
      reporter: 'reporters/custom.js',
    })
  })

  it('sends file to reporter', function () {
    return e2e.exec(this, {
      spec: 'simple_passing_spec.coffee',
      reporter: 'reporters/uses-file.js',
    })
    .get('stdout')
    .then((stdout) => {
      expect(stdout).to.include('suite.file: cypress/integration/simple_passing_spec.coffee')
    })
  })

  describe('mochawesome', () => {
    return mochaAwesomes.forEach((ma) => {
      it(`passes with ${ma} npm custom reporter`, function () {
        return e2e.exec(this, {
          spec: 'simple_passing_spec.coffee',
          snapshot: true,
          // cypress supports passing module name, relative path, or absolute path
          reporter: require.resolve(ma),
        })
        .then(() => {
          if (ma === 'mochawesome-1.5.2') {
            return fs.readFileAsync(path.join(e2ePath, 'mochawesome-reports', 'mochawesome.html'), 'utf8')
            .then((xml) => {
              expect(xml).to.include('<h3 class="suite-title">simple passing spec</h3>')

              expect(xml).to.include('<div class="status-item status-item-passing-pct success">100% Passing</div>')
            })
          }

          return fs.readJsonAsync(path.join(e2ePath, 'mochawesome-report', 'mochawesome.json'))
          .then((json) => {
            expect(json.stats).to.be.an('object')

            expect(json.stats.passes).to.eq(1)
          })
        })
      })

      it(`fails with ${ma} npm custom reporter`, function () {
        return e2e.exec(this, {
          spec: 'simple_failing_hook_spec.coffee',
          snapshot: true,
          expectedExitCode: 3,
          reporter: require.resolve(ma),
        })
        .then(() => {
          if (ma === 'mochawesome-1.5.2') {
            return fs.readFileAsync(path.join(e2ePath, 'mochawesome-reports', 'mochawesome.html'), 'utf8')
            .then((xml) => {
              expect(xml).to.include('<h3 class="suite-title">simple failing hook spec</h3>')

              expect(xml).to.not.include('.status-item-hooks')
            })
          }

          return fs.readJsonAsync(path.join(e2ePath, 'mochawesome-report', 'mochawesome.json'))
          .then((json) => {
            // mochawesome does not consider hooks to be
            // 'failures' but it does collect them in 'other'
            // HOWEVER we now change how mocha events fire to make mocha stats reflect ours
            expect(json.stats).to.be.an('object')
            expect(json.stats.passes).to.eq(1)
            expect(json.stats.failures).to.eq(3)
            expect(json.stats.skipped).to.eq(1)
            expect(json.stats.other).to.eq(0)
          })
        })
      })
    })
  })

  it('supports teamcity reporter and reporter options', function () {
    return e2e.exec(this, {
      spec: 'simple_passing_spec.coffee',
      snapshot: true,
      reporter: 'teamcity',
      reporterOptions: 'topLevelSuite=top suite,flowId=12345,useStdError=\'true\',useStdError=\'true\',recordHookFailures=\'true\',actualVsExpected=\'true\'',
    })
  })
})
