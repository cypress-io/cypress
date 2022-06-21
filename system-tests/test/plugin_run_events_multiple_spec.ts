import systemTests, { expect } from '../lib/system-tests'

describe('e2e plugin run events', () => {
  systemTests.setup()
  const events = ['before:run', 'after:run', 'before:spec', 'after:spec']

  events.forEach((event) => {
    systemTests.it(`${event} supports multiple event listeners`, {
      browser: 'electron',
      project: 'plugin-run-events-multiple',
      spec: '*',
      snapshot: false,
      config: {
        video: false,
      },
      async onRun (exec) {
        const res = await exec()
        const normOut = systemTests.normalizeStdout(res.stdout)

        expect(normOut).to.contain(`${event} first handler`)
        expect(normOut).to.contain(`${event} second handler`)
      },
    })
  })
})
