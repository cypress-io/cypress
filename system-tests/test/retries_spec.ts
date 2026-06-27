import systemTests from '../lib/system-tests'

const it = systemTests.it

describe('retries', () => {
  systemTests.setup()

  it('supports retries', {
    browser: '!chrome',
    project: 'retries-2',
    spec: 'fail-twice.cy.js',
    snapshot: true,
  })

  // TODO: merge in above once --window-size is respected in headless=new chrome browsers
  // see https://bugs.chromium.org/p/chromium/issues/detail?id=1416398
  it('supports retries (chrome)', {
    browser: 'chrome',
    project: 'retries-2',
    spec: 'fail-twice.cy.js',
    snapshot: true,
  })

  // https://github.com/cypress-io/cypress/issues/26143
  // When an attempt fails in both the beforeEach and afterEach hooks, the
  // reporter should only print a single attempt line for that attempt.
  // screenshotOnRunFailure is disabled because screenshots are irrelevant here
  // and would otherwise add browser-size-dependent output to the snapshot.
  it('only prints one attempt line when beforeEach and afterEach both fail', {
    project: 'retries-2',
    spec: 'both-hooks.cy.js',
    snapshot: true,
    config: {
      screenshotOnRunFailure: false,
    },
  })

  it('completes a run of many retries in a reasonable time', {
    spec: 'hanging_retries.cy.js',
    expectedExitCode: 10,
  })

  it('prints current retries', {
    spec: 'current_retries.cy.js',
  })
})
