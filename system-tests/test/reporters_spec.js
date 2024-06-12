const path = require('path')
const { fs } = require('@packages/server/lib/util/fs')
const glob = require('@packages/server/lib/util/glob')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

const mochaAwesomes = [
  'mochawesome-1.5.2',
  'mochawesome-2.3.1',
  'mochawesome-3.0.1',
]

describe('e2e reporters', () => {
  systemTests.setup()

  it('reports error if cannot load reporter', function () {
    return systemTests.exec(this, {
      spec: 'simple_passing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      reporter: 'module-does-not-exist',
    })
  })

  // https://github.com/cypress-io/cypress/issues/1192
  it('reports error when thrown from reporter', function () {
    return systemTests.exec(this, {
      spec: 'simple_passing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      reporter: 'reporters/throws.js',
    })
  })

  it('supports junit reporter and reporter options', function () {
    return systemTests.exec(this, {
      spec: 'simple_passing.cy.js,simple_failing.cy.js',
      snapshot: true,
      reporter: 'junit',
      reporterOptions: 'mochaFile=junit-output/result.[hash].xml,testCaseSwitchClassnameAndName=true',
      expectedExitCode: 2,
    })
    .then(() => {
      return glob(path.join(e2ePath, 'junit-output', 'result.*.xml'))
      .then((paths) => {
        expect(paths.length).to.eq(2)

        return Promise.all([fs.readFileAsync(paths[0], 'utf8'), fs.readFileAsync(paths[1], 'utf8')])
        .then((results) => {
          const str = results.join('')

          expect(str).to.include('<testsuite name="simple passing spec"')
          expect(str).to.include('<testcase name="passes"')
          expect(str).to.include('classname="simple passing spec passes"')

          expect(str).to.include('<testsuite name="simple failing spec"')
          expect(str).to.include('<testcase name="fails1"')
          expect(str).to.include('<testcase name="fails2"')
          expect(str).to.include('classname="simple failing spec fails1"')
          expect(str).to.include('classname="simple failing spec fails2"')
        })
      })
    })
  })

  it('supports local custom reporter', function () {
    return systemTests.exec(this, {
      spec: 'simple_passing.cy.js',
      snapshot: true,
      reporter: 'reporters/custom.js',
    })
  })

  it('sends file to reporter', function () {
    return systemTests.exec(this, {
      spec: 'simple_passing.cy.js',
      reporter: 'reporters/uses-file.js',
    })
    .then(({ stdout }) => {
      expect(stdout).to.include('suite.file: cypress/e2e/simple_passing.cy.js')
    })
  })

  describe('mochawesome', () => {
    return mochaAwesomes.forEach((ma) => {
      it(`passes with ${ma} npm custom reporter`, function () {
        return systemTests.exec(this, {
          spec: 'simple_passing.cy.js',
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

      it(`pending with ${ma} npm custom reporter`, function () {
        return systemTests.exec(this, {
          spec: 'simple_pending.cy.js',
          snapshot: true,
          // cypress supports passing module name, relative path, or absolute path
          reporter: require.resolve(ma),
        })
        .then(() => {
          if (ma === 'mochawesome-1.5.2') {
            return fs.readFileAsync(path.join(e2ePath, 'mochawesome-reports', 'mochawesome.html'), 'utf8')
            .then((xml) => {
              expect(xml).to.include('<h3 class="suite-title">simple pending spec</h3>')

              expect(xml).to.include('<div class="status-item status-item-pending-pct">100% Pending</div>')
            })
          }

          return fs.readJsonAsync(path.join(e2ePath, 'mochawesome-report', 'mochawesome.json'))
          .then((json) => {
            expect(json.stats).to.be.an('object')

            expect(json.stats.pending).to.eq(1)

            // https://github.com/cypress-io/cypress/issues/24477
            expect(json.stats.skipped).to.eq(0)
            expect(json.stats.hasSkipped).to.eq(false)
          })
        })
      })

      it(`fails with ${ma} npm custom reporter`, function () {
        return systemTests.exec(this, {
          spec: 'simple_failing_hook.cy.js',
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
    return systemTests.exec(this, {
      spec: 'simple_passing.cy.js',
      snapshot: true,
      reporter: 'teamcity',
      reporterOptions: 'topLevelSuite=top suite,flowId=12345,useStdError=\'true\',useStdError=\'true\',recordHookFailures=\'true\',actualVsExpected=\'true\'',
    })
  })

  it('shows slow tests in yellow', function () {
    return systemTests.exec(this, {
      spec: 'slowTestThreshold.cy.js',
      snapshot: false,
      stripAnsi: false,
      config: {
        slowTestThreshold: 1,
      },
      processEnv: {
        MOCHA_COLORS: 1,
        CI: 1,
        CIRCLECI: true,
      },
    }).then((result) => {
      expect(result.stdout.match(/passes inherited(.*)/)[1], 'when verifying "passes inherited" test time colors').to.contain('\u001b[33m')
      expect(result.stdout.match(/passes quickly(.*)/)[1], 'when verifying "passes quickly" test time colors').not.to.contain('\u001b[33m')
      expect(result.stdout.match(/passes slowly(.*)/)[1], 'when verifying "passes slowly" test time color').to.contain('\u001b[33m')
    })
  })
})
