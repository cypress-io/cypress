import systemTests from '../lib/system-tests'

const expectInOrder = (stdout: string, lines: string[]) => {
  let searchFrom = 0

  lines.forEach((line, i) => {
    const index = stdout.indexOf(line, searchFrom)

    expect(index, `expected "${line}" in stdout after "${lines[i - 1] ?? 'the start'}"`).to.be.at.least(0)
    searchFrom = index + line.length
  })
}

describe('e2e combined plugin event handlers', () => {
  systemTests.setup()

  systemTests.it('runs every handler registered for an event, in registration order', {
    browser: 'electron',
    project: 'plugin-combined-handlers',
    spec: 'combined_handlers.cy.ts',
    snapshot: false,
    async onRun (exec) {
      const { stdout } = await exec()

      expectInOrder(stdout, [
        'before:run handler 1',
        'before:run handler 2',
        'before:browser:launch handler 2 received env from handler 1: first',
        'before:spec handler 1',
        'before:spec handler 2',
        'after:screenshot handler 2 received path from handler 1: screenshot-replacement.png',
        'after:spec handler 1',
        'after:spec handler 2',
        'after:run handler 1',
        'after:run handler 2',
      ])
    },
  })

  systemTests.it('does not run later handlers when an earlier one throws', {
    browser: 'electron',
    project: 'plugin-combined-handlers',
    spec: 'combined_handlers.cy.ts',
    configFile: 'cypress.config.throws.ts',
    snapshot: false,
    expectedExitCode: 1,
    async onRun (exec) {
      const { stdout } = await exec()

      expect(stdout).to.contain('before:run handler 1 failed')
      expect(stdout).not.to.contain('before:run handler 2')
    },
  })
})
