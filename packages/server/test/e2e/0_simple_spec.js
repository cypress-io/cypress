const e2e = require('../support/helpers/e2e')

describe('e2e simple stuff', () => {
  e2e.setup()

  e2e.it('passes', {
    spec: 'simple_spec.coffee',
    snapshot: true,
    expectedExitCode: 0,
    onRun (exec, browser, ctx) {
      // example of how to programmatically control
      // the stdout on a per browser basis and to
      // prove that snapshots compare correctly without
      // getting jammed up on the duplicate snapshot names
      // if (browser === 'chrome') {
      //   return exec({
      //     onStdout (stdout) {
      //       debugger

      //       return 'foobar'
      //     },
      //   })
      // }

      return exec()
    },
  })
})
