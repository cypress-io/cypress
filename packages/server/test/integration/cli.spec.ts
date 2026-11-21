import _ from 'lodash'
import execa from 'execa'
import semver from 'semver'
import { beforeEach, describe, expect, it } from 'vitest'
import pkg from '../../package.json'

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

// spawning child processes takes a while
describe('CLI Interface', { timeout: 20_000 }, () => {
  it('writes out ping value and exits', async () => {
    const { stdout } = await execa('npm', ['run', 'dev', '--', '--cwd=/foo/bar', '--smoke-test', '--ping=12345'], { env, extendEnv: false })

    expect(clean(stdout)).toBe('12345')
  })

  // This fails on MacOS due to an apparent limit on the buffer size of stdout
  it('writes out package.json and exits', async () => {
    const { stdout } = await execa('npm', ['run', 'dev', '--', '--return-pkg'], { env, extendEnv: false })
    const json = JSON.parse(clean(stdout))

    expect(json.name).toBe('cypress')
    expect(json.productName, stdout).toBe('Cypress')
  })

  // this tests that our exit codes are correct.
  // there was a bug at one point where we incorrectly
  // spawned child electron processes and did not bubble
  // up their exit codes to the calling process. this
  // caused false-positives in CI because tests were failing
  // but the exit code was always zero
  describe('exit codes', () => {
    describe('from start script command', () => {
      it('exits with code 22', async () => {
        const { exitCode, message } = await execa(`${pkg.scripts.dev} --exit-with-code=22`, { shell: true, reject: false })

        expect(exitCode, message).toBe(22)
      })

      it('exits with code 0', async () => {
        const { exitCode, message } = await execa(`${pkg.scripts.dev} --exit-with-code=0`, { shell: true, reject: false })

        expect(exitCode, message).toBe(0)
      })
    })

    describe('through NPM script', () => {
      let npmVersion: string | null = null

      /**
       * In certain versions of npm, code with an exit code of 10 (Internal Runtime Javascript Failure)
       * is ultimately displayed as an exit code of 1 (Uncaught Runtime Exception).
       * This seems to occur before Node 7 / NPM 4 and between Node 14/ NPM 7 and Node 16 / NPM 8.
       * Please see https://github.com/arzzen/all-exit-error-codes/blob/master/programming-languages/javascript/nodejs.md
       * for more details.
       */
      const doesNpmObscureInternalExitCode = (): boolean => {
        return semver.lt(npmVersion, '4.0.0') || (semver.gt(npmVersion, '6.0.0') && semver.lt(npmVersion, '8.0.0'))
      }

      beforeEach(() => {
        return execa('npm', ['-version'])
        .then((val) => val.stdout)
        .then((version) => {
          npmVersion = version

          expect(npmVersion).toBeTypeOf('string')
        })
      })

      it('passes a non-zero exit code through npm', async () => {
        const expectedCode = doesNpmObscureInternalExitCode() ? 1 : 10
        const { exitCode, message } = await execa('npm', ['run', 'dev', '--', '--exit-with-code=10'], { reject: false })

        expect(exitCode, message).toBe(expectedCode)
      })

      it('npm passes on 0 exit code', async () => {
        const { exitCode, message } = await execa('npm', ['run', 'dev', '--', '--exit-with-code=0'], { reject: false })

        expect(exitCode, message).toBe(0)
      })
    })
  })
})
