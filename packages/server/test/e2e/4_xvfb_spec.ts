import mockedEnv from 'mocked-env'

const xvfb = require('../../../../cli/lib/exec/xvfb')
const e2e = require('../support/helpers/e2e')

function onServer (app) {
  app.get('/', (_req, res) => {
    res.send(`<html><body></body></html>`)
  })
}

describe('e2e xvfb', function () {
  e2e.setup({
    servers: {
      port: 11121,
      onServer,
    },
    settings: {
      baseUrl: 'http://localhost:11121',
    },
  })

  // beforeEach(function () {
  //   if (process.platform !== 'linux') {
  //     throw new Error(`xvfb can only be used on linux. Current platform: ${process.platform}`)
  //   }

  //   this.restoreEnv = mockedEnv({
  //     // a nulled DISPLAY variable forces xvfb to be used
  //     'DISPLAY': undefined,
  //   })

  //   expect(xvfb.isNeeded()).to.be.true

  //   // e2e tests don't normally use the CLI, so xvfb is not available yet
  //   return xvfb.start()
  // })

  // afterEach(function () {
  //   this.restoreEnv()
  // })

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'xvfb_spec.js',
      snapshot: false,
      expectedExitCode: 0,
      browser: 'chrome',
      exit: false,
    })
  })
})
