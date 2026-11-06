const { default: systemTests, expect } = require('../lib/system-tests')

describe('e2e promises', () => {
  systemTests.setup()

  systemTests.it('attributes async command failures to their tests', {
    project: 'async-promise-completion',
    spec: 'failures.cy.ts',
    expectedExitCode: 4,
    onRun: async (exec) => {
      const result = await exec()

      for (const marker of ['ASYNC_AFTER_AWAIT_ASSERTION', 'ASYNC_LATER_BATCH_ASSERTION', 'ASYNC_EARLY_QUEUE_ASSERTION', 'ASYNC_PENDING_NATIVE_ASSERTION']) {
        expect(result.stdout).to.include(marker)
      }

      return result
    },
  })

  systemTests.it('attributes async hook failures before entering the body', {
    project: 'async-promise-completion',
    spec: 'hook-failure.cy.ts',
    expectedExitCode: 1,
    onRun: async (exec) => {
      const result = await exec()

      expect(result.stdout).to.include('ASYNC_HOOK_ASSERTION')
      expect(result.stdout).not.to.include('ASYNC_HOOK_BODY_MUST_NOT_RUN')

      return result
    },
  })

  systemTests.it('settles canceled async queues with the stop error', {
    project: 'async-promise-completion',
    spec: 'cancellation.cy.ts',
    expectedExitCode: 2,
    onRun: async (exec) => {
      const result = await exec()

      expect(result.stdout).to.include('Cypress test was stopped while running this command.')

      return result
    },
  })

  systemTests.it('keeps native promises and async hooks working', {
    project: 'async-promise-completion',
    spec: 'passing.cy.ts',
    expectedExitCode: 0,
  })

  systemTests.it('runs commands appended during the terminal stability wait', {
    project: 'async-promise-completion',
    spec: 'stability-window.cy.ts',
    expectedExitCode: 1,
    onRun: async (exec) => {
      const result = await exec()

      expect(result.stdout).to.include('ASYNC_STABILITY_WINDOW_ASSERTION')

      return result
    },
  })

  systemTests.it('does not leak late async commands after an early failure', {
    project: 'async-promise-completion',
    spec: 'late-after-failure.cy.ts',
    expectedExitCode: 1,
    onRun: async (exec) => {
      const result = await exec()

      expect(result.stdout).to.include('ASYNC_EARLY_FAILURE_BEFORE_NATIVE_END')
      expect(result.stdout).to.include('1 passing')
      expect(result.stdout).not.to.include('AssertionError: ASYNC_COMMAND_LEAKED_INTO_NEXT_TEST')

      return result
    },
  })

  systemTests.it('failing1', {
    spec: 'promises.cy.js',
    snapshot: true,
    expectedExitCode: 2,
    config: { screenshotOnRunFailure: false },
  })
})
