import systemTests from '../lib/system-tests'

describe('e2e Cypress.stop()', () => {
  systemTests.setup()

  systemTests.it('stops execution when called in before', {
    project: 'cypres-stop',
    spec: 'cypress-stop-before.cy.js',
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

      const beforeRunCount = (stderr.match(/test:before:run(?!:async)/g) || []).length
      const beforeRunAsyncCount = (stderr.match(/test:before:run:async/g) || []).length
      const beforeAfterRunAsyncCount = (stderr.match(/test:before:after:run:async/g) || []).length
      const afterRunCount = (stderr.match(/test:after:run(?!:async)/g) || []).length
      const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

      expect(beforeRunCount).to.equal(1)
      expect(beforeRunAsyncCount).to.equal(1)
      expect(beforeAfterRunAsyncCount).to.equal(0)
      expect(afterRunCount).to.equal(0)
      expect(afterRunAsyncCount).to.equal(0)

      return stderr
    },
  })

  systemTests.it('stops execution when called in beforeEach', {
    project: 'cypres-stop',
    spec: 'cypress-stop-beforeEach.cy.js',
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

      const beforeRunCount = (stderr.match(/test:before:run(?!:async)/g) || []).length
      const beforeRunAsyncCount = (stderr.match(/test:before:run:async/g) || []).length
      const beforeAfterRunAsyncCount = (stderr.match(/test:before:after:run:async/g) || []).length
      const afterRunCount = (stderr.match(/test:after:run(?!:async)/g) || []).length
      const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

      expect(beforeRunCount).to.equal(1)
      expect(beforeRunAsyncCount).to.equal(1)
      expect(beforeAfterRunAsyncCount).to.equal(0)
      expect(afterRunCount).to.equal(0)
      expect(afterRunAsyncCount).to.equal(0)

      return stderr
    },
  })

  systemTests.it('stops execution when called in test', {
    project: 'cypres-stop',
    spec: 'cypress-stop-test.cy.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    processEnv: {
      ELECTRON_ENABLE_LOGGING: 1,
    },
    onStderr: (stderr) => {
      expect(stderr).to.include('test 1')
      expect(stderr).to.include('test 2')
      expect(stderr).to.not.include('test 3')

      const beforeRunCount = (stderr.match(/test:before:run(?!:async)/g) || []).length
      const beforeRunAsyncCount = (stderr.match(/test:before:run:async/g) || []).length
      const beforeAfterRunAsyncCount = (stderr.match(/test:before:after:run:async/g) || []).length
      const afterRunCount = (stderr.match(/test:after:run(?!:async)/g) || []).length
      const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

      expect(beforeRunCount).to.equal(2)
      expect(beforeRunAsyncCount).to.equal(2)
      expect(beforeAfterRunAsyncCount).to.equal(1)
      expect(afterRunCount).to.equal(1)
      expect(afterRunAsyncCount).to.equal(1)

      return stderr
    },
  })

  systemTests.it('stops execution when called in afterEach', {
    project: 'cypres-stop',
    spec: 'cypress-stop-afterEach.cy.js',
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

      const beforeRunCount = (stderr.match(/test:before:run(?!:async)/g) || []).length
      const beforeRunAsyncCount = (stderr.match(/test:before:run:async/g) || []).length
      const beforeAfterRunAsyncCount = (stderr.match(/test:before:after:run:async/g) || []).length
      const afterRunCount = (stderr.match(/test:after:run(?!:async)/g) || []).length
      const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

      expect(beforeRunCount).to.equal(1)
      expect(beforeRunAsyncCount).to.equal(1)
      expect(beforeAfterRunAsyncCount).to.equal(1)
      expect(afterRunCount).to.equal(1)
      expect(afterRunAsyncCount).to.equal(1)

      return stderr
    },
  })

  systemTests.it('stops execution when called in after', {
    project: 'cypres-stop',
    spec: 'cypress-stop-after.cy.js',
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

      const beforeRunCount = (stderr.match(/test:before:run(?!:async)/g) || []).length
      const beforeRunAsyncCount = (stderr.match(/test:before:run:async/g) || []).length
      const beforeAfterRunAsyncCount = (stderr.match(/test:before:after:run:async/g) || []).length
      const afterRunCount = (stderr.match(/test:after:run(?!:async)/g) || []).length
      const afterRunAsyncCount = (stderr.match(/test:after:run:async/g) || []).length

      expect(beforeRunCount).to.equal(1)
      expect(beforeRunAsyncCount).to.equal(1)
      expect(beforeAfterRunAsyncCount).to.equal(1)
      expect(afterRunCount).to.equal(1)
      expect(afterRunAsyncCount).to.equal(1)

      return stderr
    },
  })
})
