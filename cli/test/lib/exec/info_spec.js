require('../../spec_helper')

const os = require('os')
const util = require(`${lib}/util`)
const state = require(`${lib}/tasks/state`)
const info = require(`${lib}/exec/info`)
const spawn = require(`${lib}/exec/spawn`)

const snapshot = require('../../support/snapshot')
const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

describe('exec info', function () {
  beforeEach(function () {
    // sinon.stub(util, 'isInstalledGlobally').returns(true)
    sinon.stub(process, 'exit')
    os.platform.returns('linux')
    sinon.stub(os, 'totalmem').returns(1.2e+9)
    sinon.stub(os, 'freemem').returns(4e+8)
  })

  it('prints collected info without env vars', async () => {
    sinon.stub(spawn, 'start').resolves()
    sinon.stub(info, 'findProxyEnvironmentVariables').returns({})
    sinon.stub(info, 'findCypressEnvironmentVariables').returns({})
    sinon.stub(util, 'getApplicationDataFolder')
    .withArgs('browsers').returns('/user/app/data/path/to/browsers')
    .withArgs().returns('/user/app/data/path')

    sinon.stub(state, 'getCacheDir').returns('/user/path/to/binary/cache')

    const output = stdout.capture()

    await info.start()
    stdout.restore()

    snapshot('cypress info without browsers or vars', normalize(output.toString()))
  })
})
