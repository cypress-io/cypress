const { expect } = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

describe('semantic-commits/get-current-release-data', () => {
  let execSyncStub
  let execFileSyncStub
  let getCurrentReleaseData

  const SHA_16_2_0 = 'db52e1e7720c445afdffac740185bcf2b08a9b8c'

  const npmInfo = {
    'dist-tags': { latest: '16.2.0' },
    versions: ['15.21.0', '15.21.1', '16.0.0', '16.2.0'],
    buildInfo: { commitSha: SHA_16_2_0, commitDate: 'date-16.2.0' },
  }

  const stubExec = ({ tag, latestIsAncestor = false }) => {
    execSyncStub.withArgs('yarn info cypress --json').returns(JSON.stringify({ data: npmInfo }))
    execSyncStub.withArgs('yarn info cypress@15.21.1 --json').returns(JSON.stringify({
      data: { buildInfo: { commitSha: 'sha-15.21.1', commitDate: 'date-15.21.1' } },
    }))

    const ancestorStub = execFileSyncStub.withArgs('git', ['merge-base', '--is-ancestor', SHA_16_2_0, 'HEAD'])

    latestIsAncestor ? ancestorStub.returns('') : ancestorStub.throws(new Error('not an ancestor'))

    const describeStub = execFileSyncStub.withArgs('git', ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'])

    tag ? describeStub.returns(`${tag}\n`) : describeStub.throws(new Error('No names found'))
  }

  beforeEach(() => {
    execSyncStub = sinon.stub()
    execFileSyncStub = sinon.stub()

    getCurrentReleaseData = proxyquire('../../semantic-commits/get-current-release-data', {
      child_process: { execSync: execSyncStub, execFileSync: execFileSyncStub },
    }).getCurrentReleaseData
  })

  it('uses the npm latest release on the current major', () => {
    stubExec({ tag: 'v16.2.0', latestIsAncestor: true })

    expect(getCurrentReleaseData(false)).to.include({
      version: '16.2.0',
      isPreviousMajor: false,
      buildSha: SHA_16_2_0,
      commitDate: 'date-16.2.0',
    })
  })

  it('uses the newest release of a previous major', () => {
    stubExec({ tag: 'v15.21.1' })

    expect(getCurrentReleaseData(false)).to.include({
      version: '15.21.1',
      isPreviousMajor: true,
      buildSha: 'sha-15.21.1',
      commitDate: 'date-15.21.1',
    })
  })

  it('uses the npm latest release when it is in the branch history but not tagged yet', () => {
    stubExec({ tag: 'v15.21.1', latestIsAncestor: true })

    expect(getCurrentReleaseData(false)).to.include({ version: '16.2.0', isPreviousMajor: false })
  })

  it('uses the npm latest release when no release tag is reachable', () => {
    stubExec({})

    expect(getCurrentReleaseData(false)).to.include({ version: '16.2.0' })
  })
})
