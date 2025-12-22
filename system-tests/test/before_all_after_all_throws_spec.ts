import systemTests from '../lib/system-tests'

describe('before all and after all throw', () => {
  const getAfterRunAsyncCount = (stderr: string) => {
    const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

    return {
      afterRunAsyncCount,
    }
  }

  systemTests.setup()

  systemTests.it('events still fire after before all and after all throw', {
    project: 'before-all-after-all-throws',
    spec: 'test.cy.js',
    snapshot: true,
    expectedExitCode: 1,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('before all')
      expect(stderr).to.not.include('test body 1')
      expect(stderr).to.not.include('test body 2')
      expect(stderr).to.include('after all')

      const { afterRunAsyncCount } = getAfterRunAsyncCount(stderr)

      expect(afterRunAsyncCount, 'afterRunAsyncCount').to.equal(1)

      return stderr
    },
  })
})
