import systemTests from '../lib/system-tests'

describe('Cypress.stop()', () => {
  const getRunnableEventCounts = (stderr: string) => {
    const beforeRunCount = (stderr.match(/test:before:run(?!:async)/g) || []).length
    const beforeRunAsyncCount = (stderr.match(/test:before:run:async/g) || []).length
    const beforeAfterRunAsyncCount = (stderr.match(/test:before:after:run:async/g) || []).length
    const afterRunCount = (stderr.match(/test:after:run(?!:async)/g) || []).length
    const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

    return {
      beforeRunCount,
      beforeRunAsyncCount,
      beforeAfterRunAsyncCount,
      afterRunCount,
      afterRunAsyncCount,
    }
  }

  const getGlobalHooks = (stderr: string) => {
    const globalBeforeCalled = (stderr.match(/global before(?!Each)/g) || []).length > 0
    const globalBeforeEachCalled = (stderr.match(/global beforeEach/g) || []).length > 0
    const globalAfterEachCalled = (stderr.match(/global afterEach/g) || []).length > 0
    const globalAfterCalled = (stderr.match(/global after(?!Each)/g) || []).length > 0

    return {
      globalBeforeCalled,
      globalBeforeEachCalled,
      globalAfterEachCalled,
      globalAfterCalled,
    }
  }

  systemTests.setup()

  systemTests.it('stops execution when called in before', {
    project: 'cypress-stop',
    spec: 'before.cy.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('before 1')
      expect(stderr).to.include('before 2')
      expect(stderr).to.not.include('before 3')

      const { globalBeforeCalled, globalBeforeEachCalled, globalAfterEachCalled, globalAfterCalled } = getGlobalHooks(stderr)

      expect(globalBeforeCalled, 'globalBeforeCalled').to.be.true
      expect(globalBeforeEachCalled, 'globalBeforeEachCalled').to.be.false
      expect(globalAfterEachCalled, 'globalAfterEachCalled').to.be.false
      expect(globalAfterCalled, 'globalAfterCalled').to.be.false

      const { beforeRunCount, beforeRunAsyncCount, beforeAfterRunAsyncCount, afterRunCount, afterRunAsyncCount } = getRunnableEventCounts(stderr)

      expect(beforeRunCount, 'beforeRunCount').to.equal(1)
      expect(beforeRunAsyncCount, 'beforeRunAsyncCount').to.equal(1)
      expect(beforeAfterRunAsyncCount, 'beforeAfterRunAsyncCount').to.equal(1)
      expect(afterRunCount, 'afterRunCount').to.equal(1)
      expect(afterRunAsyncCount, 'afterRunAsyncCount').to.equal(1)

      return stderr
    },
  })

  systemTests.it('stops execution when called in beforeEach', {
    project: 'cypress-stop',
    spec: 'beforeEach.cy.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('beforeEach 1')
      expect(stderr).to.include('beforeEach 2')
      expect(stderr).to.not.include('beforeEach 3')

      const { globalBeforeCalled, globalBeforeEachCalled, globalAfterEachCalled, globalAfterCalled } = getGlobalHooks(stderr)

      expect(globalBeforeCalled, 'globalBeforeCalled').to.be.true
      expect(globalBeforeEachCalled, 'globalBeforeEachCalled').to.be.true
      expect(globalAfterEachCalled, 'globalAfterEachCalled').to.be.false
      expect(globalAfterCalled, 'globalAfterCalled').to.be.false

      const { beforeRunCount, beforeRunAsyncCount, beforeAfterRunAsyncCount, afterRunCount, afterRunAsyncCount } = getRunnableEventCounts(stderr)

      expect(beforeRunCount, 'beforeRunCount').to.equal(1)
      expect(beforeRunAsyncCount, 'beforeRunAsyncCount').to.equal(1)
      expect(beforeAfterRunAsyncCount, 'beforeAfterRunAsyncCount').to.equal(1)
      expect(afterRunCount, 'afterRunCount').to.equal(1)
      expect(afterRunAsyncCount, 'afterRunAsyncCount').to.equal(1)

      return stderr
    },
  })

  systemTests.it('stops execution when called in test', {
    project: 'cypress-stop',
    spec: 'test.cy.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('test 1')
      expect(stderr).to.not.include('test 2')
      expect(stderr).to.not.include('test 3')

      const { globalBeforeCalled, globalBeforeEachCalled, globalAfterEachCalled, globalAfterCalled } = getGlobalHooks(stderr)

      expect(globalBeforeCalled, 'globalBeforeCalled').to.be.true
      expect(globalBeforeEachCalled, 'globalBeforeEachCalled').to.be.true
      expect(globalAfterEachCalled, 'globalAfterEachCalled').to.be.true
      expect(globalAfterCalled, 'globalAfterCalled').to.be.false

      const { beforeRunCount, beforeRunAsyncCount, beforeAfterRunAsyncCount, afterRunCount, afterRunAsyncCount } = getRunnableEventCounts(stderr)

      expect(beforeRunCount, 'beforeRunCount').to.equal(2)
      expect(beforeRunAsyncCount, 'beforeRunAsyncCount').to.equal(2)
      expect(beforeAfterRunAsyncCount, 'beforeAfterRunAsyncCount').to.equal(2)
      expect(afterRunCount, 'afterRunCount').to.equal(2)
      expect(afterRunAsyncCount, 'afterRunAsyncCount').to.equal(2)

      return stderr
    },
  })

  systemTests.it('stops execution when called in afterEach', {
    project: 'cypress-stop',
    spec: 'afterEach.cy.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('afterEach 1')
      expect(stderr).to.include('afterEach 2')
      expect(stderr).to.not.include('afterEach 3')

      const { globalBeforeCalled, globalBeforeEachCalled, globalAfterEachCalled, globalAfterCalled } = getGlobalHooks(stderr)

      expect(globalBeforeCalled, 'globalBeforeCalled').to.be.true
      expect(globalBeforeEachCalled, 'globalBeforeEachCalled').to.be.true
      expect(globalAfterEachCalled, 'globalAfterEachCalled').to.be.false
      expect(globalAfterCalled, 'globalAfterCalled').to.be.false

      const { beforeRunCount, beforeRunAsyncCount, beforeAfterRunAsyncCount, afterRunCount, afterRunAsyncCount } = getRunnableEventCounts(stderr)

      expect(beforeRunCount, 'beforeRunCount').to.equal(1)
      expect(beforeRunAsyncCount, 'beforeRunAsyncCount').to.equal(1)
      expect(beforeAfterRunAsyncCount, 'beforeAfterRunAsyncCount').to.equal(1)
      expect(afterRunCount, 'afterRunCount').to.equal(1)
      expect(afterRunAsyncCount, 'afterRunAsyncCount').to.equal(1)

      return stderr
    },
  })

  systemTests.it('stops execution when called in after', {
    project: 'cypress-stop',
    spec: 'after.cy.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('after 1')
      expect(stderr).to.include('after 2')
      expect(stderr).to.not.include('after 3')

      const { globalBeforeCalled, globalBeforeEachCalled, globalAfterEachCalled, globalAfterCalled } = getGlobalHooks(stderr)

      expect(globalBeforeCalled, 'globalBeforeCalled').to.be.true
      expect(globalBeforeEachCalled, 'globalBeforeEachCalled').to.be.true
      expect(globalAfterEachCalled, 'globalAfterEachCalled').to.be.true
      expect(globalAfterCalled, 'globalAfterCalled').to.be.false

      const { beforeRunCount, beforeRunAsyncCount, beforeAfterRunAsyncCount, afterRunCount, afterRunAsyncCount } = getRunnableEventCounts(stderr)

      expect(beforeRunCount, 'beforeRunCount').to.equal(1)
      expect(beforeRunAsyncCount, 'beforeRunAsyncCount').to.equal(1)
      expect(beforeAfterRunAsyncCount, 'beforeAfterRunAsyncCount').to.equal(1)
      expect(afterRunCount, 'afterRunCount').to.equal(1)
      expect(afterRunAsyncCount, 'afterRunAsyncCount').to.equal(1)

      return stderr
    },
  })
})
