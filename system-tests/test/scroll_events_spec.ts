import systemTests from '../lib/system-tests'

const it = systemTests.it

describe('scroll events', () => {
  it('validates that scrolls can be listened to - runner UI', {
    browser: 'electron',
    project: 'e2e',
    spec: 'scroll-events.cy.js',
    runnerUi: true,
  })

  it('validates that scrolls can be listened to - no runner UI', {
    browser: 'electron',
    project: 'e2e',
    spec: 'scroll-events.cy.js',
    runnerUi: false,
  })
})
