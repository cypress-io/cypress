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
    sinon.stub(process, 'exit')

    // common stubs
    sinon.stub(spawn, 'start').resolves()
    os.platform.returns('linux')
    sinon.stub(os, 'totalmem').returns(1.2e+9)
    sinon.stub(os, 'freemem').returns(4e+8)
    sinon.stub(info, 'findProxyEnvironmentVariables').returns({})
    sinon.stub(info, 'findCypressEnvironmentVariables').returns({})
    sinon.stub(util, 'getApplicationDataFolder')
    .withArgs('browsers').returns('/user/app/data/path/to/browsers')
    .withArgs().returns('/user/app/data/path')

    sinon.stub(util, 'pkgBuildInfo').returns({
      stable: true,
    })

    sinon.stub(state, 'getCacheDir').returns('/user/path/to/binary/cache')
  })

  const startInfoAndSnapshot = async (snapshotName) => {
    expect(snapshotName, 'missing snapshot name').to.be.a('string')

    const output = stdout.capture()

    await info.start()
    stdout.restore()

    snapshot(snapshotName, normalize(output.toString()))
  }

  it('prints collected info without env vars', async () => {
    await startInfoAndSnapshot('cypress info without browsers or vars')
    expect(spawn.start).to.be.calledWith(['--mode=info'], { dev: undefined })
  })

  it('prints proxy and cypress env vars', async () => {
    info.findProxyEnvironmentVariables.returns({
      PROXY_ENV_VAR1: 'some proxy variable',
      PROXY_ENV_VAR2: 'another proxy variable',
    })

    info.findCypressEnvironmentVariables.returns({
      CYPRESS_ENV_VAR1: 'my Cypress variable',
      CYPRESS_ENV_VAR2: 'my other Cypress variable',
    })

    await startInfoAndSnapshot('cypress info with proxy and vars')
  })

  it('redacts sensitive cypress variables', async () => {
    info.findCypressEnvironmentVariables.returns({
      CYPRESS_ENV_VAR1: 'my Cypress variable',
      CYPRESS_ENV_VAR2: 'my other Cypress variable',
      CYPRESS_PROJECT_ID: 'abc123', // not sensitive
      CYPRESS_RECORD_KEY: 'really really secret stuff', // should not be printed
    })

    await startInfoAndSnapshot('cypress redacts sensitive vars')
  })

  it('logs additional info about pre-releases', async () => {
    util.pkgBuildInfo.returns({
      stable: false,
      commitSha: 'abc123',
      commitBranch: 'someBranchName',
      commitDate: new Date('02-02-2022').toISOString(),
    })

    await startInfoAndSnapshot('logs additional info about pre-releases')
  })

  it('logs if unbuilt development', async () => {
    util.pkgBuildInfo.returns(undefined)

    await startInfoAndSnapshot('logs additional info about development')
  })
})
