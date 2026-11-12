require('../spec_helper')

const _ = require('lodash')
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

  it('writes out ping value and exits', async () => {
    const { stdout } = await execa('npm', ['run', 'dev', '--', '--cwd=/foo/bar', '--smoke-test', '--ping=12345'], { env, extendEnv: false })

    expect(clean(stdout)).to.eq('12345')
  })

  // This fails on MacOS due to an apparent limit on the buffer size of stdout
  it('writes out package.json and exits', async () => {
    const { stdout } = await execa('npm', ['run', 'dev', '--', '--return-pkg'], { env, extendEnv: false })
    const json = JSON.parse(clean(stdout))

    expect(json.name).to.eq('cypress')
    expect(json.productName).to.eq('Cypress', stdout)
  })

  // this tests that our exit codes are correct.
  // there was a bug at one point where we incorrectly
  // spawned child electron processes and did not bubble
  // up their exit codes to the calling process. this
  // caused false-positives in CI because tests were failing
  // but the exit code was always zero
  context('exit codes', () => {
    describe('from start script command', () => {
      it('exits with code 22', async () => {
        const { exitCode, message } = await execa(`${pkg.scripts.dev} --exit-with-code=22`, { shell: true, reject: false })

        expect(exitCode, message).to.eq(22)
      })

      it('exits with code 0', async () => {
        const { exitCode, message } = await execa(`${pkg.scripts.dev} --exit-with-code=0`, { shell: true, reject: false })

        expect(exitCode, message).to.eq(0)
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

          expect(npmVersion).to.be.a('string')
        })
      })

      it('passes a non-zero exit code through npm', async () => {
        const expectedCode = doesNpmObscureInternalExitCode() ? 1 : 10
        const { exitCode, message } = await execa('npm', ['run', 'dev', '--', '--exit-with-code=10'], { reject: false })

        expect(exitCode, message).to.eq(expectedCode)
      })

      it('npm passes on 0 exit code', async () => {
        const { exitCode, message } = await execa('npm', ['run', 'dev', '--', '--exit-with-code=0'], { reject: false })

        expect(exitCode, message).to.eq(0)
      })
    })
  })
})
