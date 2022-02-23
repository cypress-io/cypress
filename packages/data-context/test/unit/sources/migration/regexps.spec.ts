import { expect } from 'chai'
import * as regexps from '../../../../src/sources/migration/regexps'

describe('regexps', () => {
  it('should match spec files', () => {
    const RE = new RegExp(regexps.regexps.e2e.before.defaultFolderDefaultTestFiles)
    const match = RE.exec('cypress/integration/file.spec.ts')

    expect(match?.groups).to.deep.equal({
      ext: '.spec.',
      main: 'integration',
    })
  })

  it('should match test files', () => {
    const RE = new RegExp(regexps.regexps.e2e.before.defaultFolderDefaultTestFiles)
    const match = RE.exec('cypress/integration/file.test.ts')

    expect(match?.groups).to.deep.equal({
      ext: '.test.',
      main: 'integration',
    })
  })
})
