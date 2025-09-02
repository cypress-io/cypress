import '../spec_helper'
import makeUserPackageFile from '../../scripts/build'
import snapshot from '../support/snapshot'
import la from 'lazy-ass'
import is from 'check-more-types'
import fs from '../../lib/fs'

const hasVersion = (json: any): void => {
  la(is.semver(json.version), 'cannot find version', json)
}

const normalizePackageJson = (o: any): any => {
  expect(o.buildInfo).to.include({ stable: false })
  expect(o.buildInfo.commitBranch).to.match(/.+/)
  expect(o.buildInfo.commitSha).to.match(/[a-f0-9]+/)

  return {
    ...o,
    version: 'x.y.z',
    buildInfo: 'replaced by normalizePackageJson',
  }
}

describe('package.json build', () => {
  beforeEach(function (): void {
    // stub package.json in CLI
    // with a few test props
    // the rest should come from root package.json file
    sinon.stub(fs, 'readJsonAsync').resolves({
      name: 'test',
      engines: 'test engines',
    })

    sinon.stub(fs, 'outputJsonAsync').resolves()
  })

  it('version', () => {
    return makeUserPackageFile()
    .then((result: any) => {
      hasVersion(result)

      return result
    })
  })

  it('outputs expected properties', () => {
    return makeUserPackageFile()
    .then(normalizePackageJson)
    .then(snapshot)
  })
})
