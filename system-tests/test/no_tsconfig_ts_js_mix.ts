import systemTests from '../lib/system-tests'

describe('e2e no tsconfig ts js mix', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'spec.cy.js',
    browser: 'chrome',
    project: 'no-tsconfig-ts-js-mix',
    snapshot: true,
  })

  systemTests.it('fails with no tsconfig.json error', {
    spec: 'spec.cy.ts',
    browser: 'chrome',
    project: 'no-tsconfig-ts-js-mix',
    snapshot: true,
    expectedExitCode: 1,
    async onRun (exec, browserName) {
      const { stdout } = await exec()

      expect(stdout).to.include('TsConfigNotFoundError: No tsconfig.json found, but typescript is installed. ts-loader needs a tsconfig.json file to work. Please add one to your project in either the root or the cypress directory.')
    },
  })
})
