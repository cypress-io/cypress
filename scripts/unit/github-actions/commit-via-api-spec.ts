import { expect, use } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

use(sinonChai)

const BASE_SHA = 'base-sha'
const BRANCH_SHA = 'stale-branch-sha'

const context = { repo: { owner: 'cypress-io', repo: 'cypress' } }

const notFound = () => Object.assign(new Error('Not Found'), { status: 404 })

const makeGithub = ({ branchExists }: { branchExists: boolean }) => {
  const getRef = sinon.stub()

  getRef.withArgs(sinon.match({ ref: 'heads/develop' })).resolves({ data: { object: { sha: BASE_SHA } } })

  if (branchExists) {
    getRef.withArgs(sinon.match({ ref: 'heads/bot-branch' })).resolves({ data: { object: { sha: BRANCH_SHA } } })
  } else {
    getRef.withArgs(sinon.match({ ref: 'heads/bot-branch' })).rejects(notFound())
  }

  return {
    rest: {
      git: {
        getRef,
        createRef: sinon.stub().resolves(),
        updateRef: sinon.stub().resolves(),
      },
    },
    graphql: sinon.stub().resolves({ createCommitOnBranch: { commit: { oid: 'new-sha', url: 'url' } } }),
  }
}

describe('commit-via-api', () => {
  let commitViaApi
  let filePath: string

  before(async () => {
    ({ commitViaApi } = await import('../../github-actions/commit-via-api.mjs'))
  })

  beforeEach(async () => {
    filePath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'commit-via-api-')), 'file.json')
    await fs.writeFile(filePath, '{}')
  })

  const run = (github, opts: { branchName?: string, resetToBase?: boolean } = {}) => {
    return commitViaApi({
      context,
      github,
      baseBranch: 'develop',
      branchName: 'bot-branch',
      filePaths: [filePath],
      message: 'chore: update',
      ...opts,
    })
  }

  const expectedHeadOid = (github) => github.graphql.firstCall.args[1].input.expectedHeadOid

  it('creates the branch from the base when it does not exist', async () => {
    const github = makeGithub({ branchExists: false })

    await run(github, { resetToBase: true })

    expect(github.rest.git.createRef).to.be.calledWith(sinon.match({ ref: 'refs/heads/bot-branch', sha: BASE_SHA }))
    expect(github.rest.git.updateRef).not.to.be.called
    expect(expectedHeadOid(github)).to.equal(BASE_SHA)
  })

  it('commits on top of the existing branch by default', async () => {
    const github = makeGithub({ branchExists: true })

    await run(github)

    expect(github.rest.git.updateRef).not.to.be.called
    expect(expectedHeadOid(github)).to.equal(BRANCH_SHA)
  })

  it('force-resets an existing branch to the base when resetToBase is set', async () => {
    const github = makeGithub({ branchExists: true })

    await run(github, { resetToBase: true })

    expect(github.rest.git.updateRef).to.be.calledWith(sinon.match({ ref: 'heads/bot-branch', sha: BASE_SHA, force: true }))
    expect(github.rest.git.updateRef).to.be.calledBefore(github.graphql)
    expect(expectedHeadOid(github)).to.equal(BASE_SHA)
  })

  it('never resets when committing directly to the base branch', async () => {
    const github = makeGithub({ branchExists: true })

    await run(github, { branchName: 'develop', resetToBase: true })

    expect(github.rest.git.updateRef).not.to.be.called
    expect(expectedHeadOid(github)).to.equal(BASE_SHA)
  })
})
