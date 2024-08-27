require('../spec_helper')

const _ = require('lodash')
const cp = require('child_process')
const pkg = require('../../package.json')
const execa = require('execa')
const semver = require('semver')

const anyLineWithCaret = (str) => {
  return str[0] === '>'
}

const clean = (str) => {
  // remove blank lines and slice off any line
  // starting with a caret because thats junk
  // from npm logs
  return _
  .chain(str)
  .split('\n')
  .compact()
  .reject(anyLineWithCaret)
  .join('\n')
  .value()
}

const env = _.omit(process.env, 'CYPRESS_DEBUG')

describe('CLI Interface', () => {
  beforeEach(function () {
    // set the timeout high due to
    // spawning child processes
    return this.currentTest.timeout(20000)
  })

  it('writes out ping value and exits', (done) => {
    return cp.exec('npm run dev -- --cwd=/foo/bar --smoke-test --ping=12345', { env }, (err, stdout, stderr) => {
      if (err) {
        done(err)
      }

      expect(clean(stdout)).to.eq('12345')

      return done()
    })
  })

  // This fails on MacOS due to an apparent limit on the buffer size of stdout
  it('writes out package.json and exits', (done) => {
    return cp.exec('npm run dev -- --return-pkg', { env }, (err, stdout, stderr) => {
      if (err) {
        done(err)
      }

      const json = JSON.parse(clean(stdout))

      expect(json.name).to.eq('cypress')
      expect(json.productName).to.eq('Cypress', stdout)

      return done()
    })
  })

  // this tests that our exit codes are correct.
  // there was a bug at one point where we incorrectly
  // spawned child electron processes and did not bubble
  // up their exit codes to the calling process. this
  // caused false-positives in CI because tests were failing
  // but the exit code was always zero
  context('exit codes', () => {
    describe('from start script command', () => {
      beforeEach(function () {
        this.dev = pkg.scripts.dev
      })

      it('exits with code 22', function (done) {
        const s = cp.exec(`${this.dev} --exit-with-code=22`)

        return s.on('close', (code) => {
          expect(code).to.eq(22)

          return done()
        })
      })

      it('exits with code 0', function (done) {
        const s = cp.exec(`${this.dev} --exit-with-code=0`)

        return s.on('close', (code) => {
          expect(code).to.eq(0)

          return done()
        })
      })
    })

    describe('through NPM script', () => {
      let npmVersion = null

      /**
       * In certain versions of npm, code with an exit code of 10 (Internal Runtime Javascript Failure)
       * is ultimately displayed as an exit code of 1 (Uncaught Runtime Exception).
       * This seems to occur before Node 7 / NPM 4 and between Node 14/ NPM 7 and Node 16 / NPM 8.
       * Please see https://github.com/arzzen/all-exit-error-codes/blob/master/programming-languages/javascript/nodejs.md
       * for more details.
       *
       * @returns {boolean}
       */
      const doesNpmObscureInternalExitCode = () => {
        return semver.lt(npmVersion, '4.0.0') || (semver.gt(npmVersion, '6.0.0') && semver.lt(npmVersion, '8.0.0'))
      }

      beforeEach(() => {
        return execa('npm', ['-version'])
        .then((val) => val.stdout)
        .then((version) => {
          npmVersion = version

          expect(npmVersion).to.be.a.string
        })
      })

      it('npm slurps up or not exit value on failure', (done) => {
        const expectedCode = doesNpmObscureInternalExitCode() ? 1 : 10
        const s = cp.exec('npm run dev -- --exit-with-code=10')

        return s.on('close', (code) => {
          expect(code).to.eq(expectedCode)

          return done()
        })
      })

      it('npm passes on 0 exit code', (done) => {
        const s = cp.exec('npm run dev -- --exit-with-code=0')

        return s.on('close', (code) => {
          expect(code).to.eq(0)

          return done()
        })
      })
    })
  })
})
