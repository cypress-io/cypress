import systemTests from '../lib/system-tests'

// TODO(lachlan): get these passing, issue is we need to hide the <TopNav />
// this failure is related to screenshots
// @ts-ignore it works fine
const tempSkip = Date.now() > new Date('2022-01-14') ? systemTests.it : systemTests.it.skip

describe('e2e non-proxied spec', () => {
  systemTests.setup()

  tempSkip('passes', {
    spec: 'spec.js',
    config: {
      video: false,
    },
    browser: 'chrome',
    project: 'non-proxied',
    snapshot: true,
  })
})
