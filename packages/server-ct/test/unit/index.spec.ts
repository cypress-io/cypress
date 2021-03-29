process.env.CYPRESS_INTERNAL_ENV = 'test'
import * as Updater from '@packages/server/lib/updater'
import openProject from '@packages/server/lib/open_project'
import sinon from 'sinon'
import { expect } from 'chai'
import * as Index from '../../index'

describe('index.spec', () => {
  let backupEnv

  beforeEach(() => {
    backupEnv = process.env
    process.env.CYPRESS_INTERNAL_ENV = 'production'
    sinon.spy(global, 'setInterval')
    Updater.check = 'foooobar'
    sinon.stub(Updater, 'check')
    sinon.stub(openProject, 'create').resolves()
    sinon.stub(openProject, 'launch').resolves()
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

    expect(setInterval.callCount).eq(1)
    expect(setInterval.firstCall.args[1]).eq(1000 * 60 * 60)
    expect(Updater.check.firstCall.args).eq(1)
  })
})
