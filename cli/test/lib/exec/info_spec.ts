import '../../spec_helper'
import os from 'os'
import snapshot from '../../support/snapshot'
import stdout from '../../support/stdout'
import normalize from '../../support/normalize'

import util from '../../../lib/util'
import state from '../../../lib/tasks/state'
import info from '../../../lib/exec/info'
import spawn from '../../../lib/exec/spawn'

describe('exec info', function () {
  beforeEach(function (): void {
    sinon.stub(process, 'exit')

    // common stubs
    sinon.stub(spawn, 'start').resolves()

    ;(os.platform as any).returns('linux')
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

  const startInfoAndSnapshot = async (snapshotName: string): Promise<void> => {
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
    // @ts-expect-error - is shorthand stub on a function
    util.pkgBuildInfo.returns({
      stable: false,
      commitSha: 'abc123',
      commitBranch: 'someBranchName',
      commitDate: new Date('2022-02-02').toISOString(),
    })

    await startInfoAndSnapshot('logs additional info about pre-releases')
  })

  it('logs if unbuilt development', async () => {
    // @ts-expect-error - is shorthand stub on a function
    util.pkgBuildInfo.returns(undefined)

    await startInfoAndSnapshot('logs additional info about development')
  })
})
