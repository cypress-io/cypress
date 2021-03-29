const Updater = require('@packages/server/lib/updater')
import openProject from '@packages/server/lib/open_project'
import browsers from '@packages/server/lib/browsers'
import sinon from 'sinon'
import { expect } from 'chai'
import * as Index from '../../index'

describe('index.spec', () => {
  let backupEnv
  let stub_setInterval

  beforeEach(() => {
    backupEnv = process.env
    process.env.CYPRESS_INTERNAL_ENV = 'production'
    stub_setInterval = sinon.spy(global, 'setInterval')
    sinon.stub(Updater, 'check').resolves()
    sinon.stub(openProject, 'create').resolves()
    sinon.stub(openProject, 'launch').resolves()
    sinon.stub(browsers, 'ensureAndGetByNameOrPath').resolves()
  })

  afterEach(() => {
    if (backupEnv) {
      process.env = backupEnv
      backupEnv = null
    }
  })

  it('registers update check', async () => {
    await Index.start('/path/to/project', {
      browser: 'chrome',
    })

    expect(stub_setInterval.callCount).eq(1)
    expect(stub_setInterval.firstCall.args[1]).eq(1000 * 60 * 60)
    expect(Updater.check.callCount).eq(1)
    expect(Updater.check.firstCall.args[0]).includes({
      testingType: 'ct',
      initialLaunch: true,
    })
  })
})
