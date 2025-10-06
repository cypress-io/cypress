import systemTests from '../lib/system-tests'

describe('e2e prompt', () => {
  systemTests.setup()

  systemTests.it('fails when experimentalPromptCommand is not set', {
    browser: 'electron',
    project: 'experimentalPromptCommand',
    spec: 'prompt.cy.js',
    configFile: 'cypress-disabled-prompt-experiment.config.js',
    expectedExitCode: 1,
    snapshot: true,
  })
})
