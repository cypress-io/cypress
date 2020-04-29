import _ from 'lodash'
import * as darwinHelper from '../../lib/darwin'
import * as linuxHelper from '../../lib/linux'
import * as darwinUtil from '../../lib/darwin/util'
import { utils } from '../../lib/utils'
import { expect } from 'chai'
import sinon, { SinonStub } from 'sinon'
import { browsers } from '../../lib/browsers'
import Bluebird from 'bluebird'
import fse from 'fs-extra'
import snapshot from 'snap-shot-it'

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
  .withArgs(`mdfind 'kMDItemCFBundleIdentifier=="${findAppParams.appId}"' | head -1`)
  .resolves({ stdout: `/Applications/${findAppParams.appName}` })

  ;(fse.readFile as SinonStub)
  .withArgs(`/Applications/${findAppParams.appName}/Contents/Info.plist`)
  .resolves(generatePlist(findAppParams.versionProperty, 'someVersion'))
}

describe('darwin browser detection', () => {
  beforeEach(() => {
    sinon.stub(fse, 'readFile').rejects({ code: 'ENOENT' })
    sinon.stub(utils, 'getOutput').resolves({ stdout: '' })
  })

  it('detects browsers as expected', async () => {
    // this test uses the macOS detectors to stub out the expected calls
    _.forEach(darwinHelper.browsers, (channels) => {
      _.forEach(channels, stubBrowser)
    })

    // then, it uses the main browsers list to attempt detection of all browsers, which should succeed
    const detected = (await Bluebird.mapSeries(browsers, (browser) => {
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
})
