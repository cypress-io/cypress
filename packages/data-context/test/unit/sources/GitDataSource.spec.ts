import { expect } from 'chai'
import path from 'path'
import os from 'os'
import simpleGit from 'simple-git'
import fs from 'fs-extra'
import sinon from 'sinon'
import pDefer from 'p-defer'

import { scaffoldMigrationProject } from '../helper'
import { GitDataSource } from '../../../src/sources/GitDataSource'

describe('GitDataSource', () => {
  let git: ReturnType<typeof simpleGit>
  let gitInfo: GitDataSource
  let projectPath: string
  let e2eFolder: string

  beforeEach(async () => {
    projectPath = await scaffoldMigrationProject('e2e')
    git = simpleGit({ baseDir: projectPath })
    e2eFolder = path.join(projectPath, 'cypress', 'e2e')
    const allSpecs = fs.readdirSync(e2eFolder)

    await git.init()
    await git.add(allSpecs.map((spec) => path.join(e2eFolder, spec)))
    await git.commit('add all specs')
  })

  afterEach(() => {
    gitInfo.destroy()
    gitInfo = undefined
  })

  it(`gets correct status for files on ${os.platform()}`, async () => {
    const onBranchChange = sinon.stub()
    const onGitInfoChange = sinon.stub()
    const onError = sinon.stub()

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange,
      onGitInfoChange,
      onError,
    })

    if (process.env.CI) {
      // need to set a user on CI
      await Promise.all([
        git.addConfig('user.name', 'Test User', true),
        git.addConfig('user.email', 'test-user@example.com', true),
      ])
    }

    // create a file and modify a file to express all
    // git states we are interested in (created, unmodified, modified)
    const fooSpec = path.join(e2eFolder, 'foo.cy.js')
    const aRecordSpec = path.join(e2eFolder, 'a_record.spec.js')
    const xhrSpec = path.join(e2eFolder, 'xhr.cy.js')

    fs.createFileSync(fooSpec)
    fs.writeFileSync(xhrSpec, 'it(\'modifies the file\', () => {})')

    process.chdir(projectPath)

    const dfd = pDefer()

    onGitInfoChange.onFirstCall().callsFake(dfd.resolve)

    gitInfo.setSpecs([fooSpec, aRecordSpec, xhrSpec])

    await dfd.promise

    const [created, unmodified, modified] = await Promise.all([
      gitInfo.gitInfoFor(fooSpec),
      gitInfo.gitInfoFor(aRecordSpec),
      gitInfo.gitInfoFor(xhrSpec),
    ])

    expect(created.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
    expect(created.statusType).to.eql('created')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(created.author).not.to.be.undefined
    expect(created.lastModifiedTimestamp).not.to.be.undefined

    expect(unmodified.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
    expect(unmodified.statusType).to.eql('unmodified')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(unmodified.author).not.to.be.undefined
    expect(unmodified.lastModifiedTimestamp).not.to.be.undefined

    expect(modified.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
    expect(modified.statusType).to.eql('modified')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(modified.author).not.to.be.undefined
    expect(modified.lastModifiedTimestamp).not.to.be.undefined
  })

  it(`watches switching branches on ${os.platform()}`, async () => {
    const stub = sinon.stub()
    const dfd = pDefer()

    stub.onFirstCall().callsFake(dfd.resolve)

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: stub,
      onGitInfoChange: sinon.stub(),
      onError: sinon.stub(),
    })

    const result = await dfd.promise

    expect(result).to.eq((await git.branch()).current)

    const switchBranch = pDefer()

    stub.onSecondCall().callsFake(switchBranch.resolve)

    git.checkoutLocalBranch('testing123')
    expect(await switchBranch.promise).to.eq('testing123')
  })
})
