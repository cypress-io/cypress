import _ from 'lodash'
import os from 'os'
import cp from 'child_process'
import * as darwinHelper from '../../lib/darwin'
import * as linuxHelper from '../../lib/linux'
import * as darwinUtil from '../../lib/darwin/util'
import { utils } from '../../lib/utils'
import { expect } from 'chai'
import sinon, { SinonStub } from 'sinon'
import { launch } from '../../lib/browsers'
import { knownBrowsers } from '../../lib/known-browsers'
import Bluebird from 'bluebird'
import fse from 'fs-extra'
import snapshot from 'snap-shot-it'
import { PassThrough } from 'stream'
import { FoundBrowser } from '@packages/types'

function generatePlist (key, value) {
  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>${key}</key>
        <string>${value}</string>
      </dict>
    </plist>
  `
}

function stubBrowser (findAppParams: darwinUtil.FindAppParams) {
  (utils.getOutput as unknown as SinonStub)
  .withArgs(`mdfind 'kMDItemCFBundleIdentifier=="${findAppParams.bundleId}"' | head -1`)
  .resolves({ stdout: `/Applications/${findAppParams.appName}` })

  ;(fse.readFile as SinonStub)
  .withArgs(`/Applications/${findAppParams.appName}/Contents/Info.plist`)
  .resolves(generatePlist(findAppParams.versionProperty, 'someVersion'))
}

function spawnStub () {
  const stub: any = {
    on: sinon.stub(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: sinon.stub(),
  }

  stub.once = stub.on

  stub.on.withArgs('exit').callsArgAsync(1)
  stub.on.withArgs('close').callsArgAsync(1)

  stub.stderr.end()
  stub.stdout.end()

  return stub as cp.ChildProcess
}

describe('darwin browser detection', () => {
  let getOutput: SinonStub

  beforeEach(() => {
    sinon.stub(fse, 'readFile').rejects({ code: 'ENOENT' })
    getOutput = sinon.stub(utils, 'getOutput').resolves({ stdout: '' })
  })

  it('detects browsers as expected', async () => {
    // this test uses the macOS detectors to stub out the expected calls
    _.forEach(darwinHelper.browsers, (channels) => {
      _.forEach(channels, stubBrowser)
    })

    // then, it uses the main browsers list to attempt detection of all browsers, which should succeed
    const detected = (await Bluebird.mapSeries(knownBrowsers, (browser) => {
      return darwinHelper.detect(browser)
      .then((foundBrowser) => {
        const findAppParams = darwinHelper.browsers[browser.name][browser.channel]

        return _.merge(browser, foundBrowser, { findAppParams })
      })
    }))

    snapshot(detected)
  })

  it('getVersionString is re-exported from linuxHelper', () => {
    expect(darwinHelper.getVersionString).to.eq(linuxHelper.getVersionString)
  })

  context('forces correct architecture', () => {
    function stubForArch (arch: 'arm64' | 'x64') {
      sinon.stub(process, 'env').value({ env2: 'false', env3: 'true' })
      sinon.stub(os, 'arch').returns(arch)
      sinon.stub(os, 'platform').returns('darwin')
      getOutput.restore()

      return sinon.stub(cp, 'spawn').returns(spawnStub())
    }

    context('in version detection', () => {
      it('uses arch and ARCHPREFERENCE on arm64', async () => {
        const cpSpawn = stubForArch('arm64')

        // this will error since we aren't setting stdout
        await (darwinHelper.detect(knownBrowsers[0]).catch(() => {}))

        // first call is mdfind, second call is getVersionString
        const { args } = cpSpawn.getCall(1)

        expect(args[0]).to.eq('arch')
        expect(args[1]).to.deep.eq([knownBrowsers[0].binary, '--version'])
        expect(args[2].env).to.deep.include({
          ARCHPREFERENCE: 'arm64,x86_64',
          env2: 'false',
          env3: 'true',
        })
      })

      it('does not use `arch` on x64', async () => {
        const cpSpawn = stubForArch('x64')

        // this will error since we aren't setting stdout
        await (darwinHelper.detect(knownBrowsers[0]).catch(() => {}))

        // first call is mdfind, second call is getVersionString
        const { args } = cpSpawn.getCall(1)

        expect(args[0]).to.eq(knownBrowsers[0].binary)
        expect(args[1]).to.deep.eq(['--version'])
        expect(args[2].env).to.deep.include({
          env2: 'false',
          env3: 'true',
        })
      })
    })

    context('in browser launching', () => {
      it('uses arch and ARCHPREFERENCE on arm64', async () => {
        const cpSpawn = stubForArch('arm64')

        await launch({ path: 'chrome' } as unknown as FoundBrowser, 'url', 123, ['arg1'], { env1: 'true', env2: 'true' })

        const { args } = cpSpawn.getCall(0)

        expect(args[0]).to.eq('arch')
        expect(args[1]).to.deep.eq(['chrome', 'url', 'arg1'])
        expect(args[2].env).to.deep.include({
          ARCHPREFERENCE: 'arm64,x86_64',
          env1: 'true',
          env2: 'false',
          env3: 'true',
        })
      })

      it('does not use `arch` on x64', async () => {
        const cpSpawn = stubForArch('x64')

        await launch({ path: 'chrome' } as unknown as FoundBrowser, 'url', 123, ['arg1'], { env1: 'true', env2: 'true' })

        const { args } = cpSpawn.getCall(0)

        expect(args[0]).to.eq('chrome')
        expect(args[1]).to.deep.eq(['url', 'arg1'])
        expect(args[2].env).to.deep.include({
          env1: 'true',
          env2: 'false',
          env3: 'true',
        })

        expect(args[2].env).to.not.have.property('ARCHPREFERENCE')
      })
    })
  })
})
