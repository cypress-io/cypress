import { assert, expect } from 'chai'
import path from 'path'
import os from 'os'
import simpleGit from 'simple-git'
import fs from 'fs-extra'
import sinon from 'sinon'
import pDefer from 'p-defer'
import chokidar from 'chokidar'

import { scaffoldMigrationProject } from '../helper'
import { GitDataSource } from '../../../src/sources/GitDataSource'
import { toPosix } from '../../../src/util/file'

describe('GitDataSource', () => {
  let git: ReturnType<typeof simpleGit>
  let gitInfo: GitDataSource
  let projectPath: string
  let e2eFolder: string

  beforeEach(async () => {
    projectPath = await scaffoldMigrationProject('e2e')
    git = simpleGit({ baseDir: projectPath })
    e2eFolder = path.join(projectPath, 'cypress', 'e2e')
    const allSpecs = await fs.readdir(e2eFolder)

    if (process.env.CI) {
      // need to set a user on CI
      await Promise.all([
        git.addConfig('user.name', 'Test User', true, 'global'),
        git.addConfig('user.email', 'test-user@example.com', true, 'global'),
      ])
    }

    await git.init()
    await git.add(allSpecs.map((spec) => path.join(e2eFolder, spec)))
    await git.commit('add all specs')
  })

  afterEach(async () => {
    if (gitInfo) {
      await gitInfo.destroy()
    }

    gitInfo = undefined

    sinon.restore()
  })

  it(`gets correct status for files on ${os.platform()}`, async function () {
    const onBranchChange = sinon.stub()
    const dfd = pDefer()

    // create a file and modify a file to express all
    // git states we are interested in (created, unmodified, modified)
    const fooSpec = toPosix(path.join(e2eFolder, 'foo.cy.js'))
    const aRecordSpec = toPosix(path.join(e2eFolder, 'a_record.cy.js'))
    const xhrSpec = toPosix(path.join(e2eFolder, 'xhr.cy.js'))

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange,
      onGitInfoChange: dfd.resolve,
      onError: (err: any) => {
        assert.fail(err)
      },
    })

    await fs.createFile(fooSpec)
    await fs.writeFile(xhrSpec, 'it(\'modifies the file\', () => {})')

    gitInfo.setSpecs([fooSpec, aRecordSpec, xhrSpec])

    const gitInfoChangeResolve = await dfd.promise

    expect(gitInfoChangeResolve).to.eql([fooSpec, aRecordSpec, xhrSpec])

    const created = gitInfo.gitInfoFor(fooSpec)!
    const unmodified = gitInfo.gitInfoFor(aRecordSpec)!
    const modified = gitInfo.gitInfoFor(xhrSpec)!

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

  it(`handles files with special characters on ${os.platform()}`, async () => {
    // Validates handling of edge cases from https://github.com/cypress-io/cypress/issues/22454
    let filepaths = [
      'file withSpace.cy.js',
      'file~WithTilde.cy.js',
      'file-withHyphen.cy.js',
      'file_withUnderscore.cy.js',
      'file;WithSemicolon.cy.js',
      'file,withComma.cy.js',
      'file@withAtSymbol.cy.js',
      'file^withCarat.cy.js',
      'file=withEqual.cy.js',
      'file+withPlus.cy.js',
      'file\'withOneSingleQuote.cy.js',
    ]

    if (os.platform() !== 'win32') {
      // Double quote not a legal character on NTFS
      filepaths.push('file"withOneDoubleQuote.cy.js')
    }

    filepaths = filepaths
    .map((filename) => path.join(e2eFolder, filename))
    .map((filepath) => toPosix(filepath))

    const dfd = pDefer()

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: sinon.stub(),
      onGitInfoChange: dfd.resolve,
      onError: sinon.stub(),
    })

    await Promise.all(
      filepaths.map((filepath) => fs.createFile(filepath)),
    )

    gitInfo.setSpecs(filepaths)

    await dfd.promise

    const results = filepaths.map((filepath) => {
      return gitInfo.gitInfoFor(filepath)
    })

    expect(results).to.have.lengthOf(filepaths.length)

    filepaths.forEach((filepath, index) => {
      const result = results[index]

      expect(result?.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
      expect(result?.statusType).to.eql('created')
    })
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

  it(`handles error while watching .git on ${os.platform()}`, async () => {
    sinon.stub(chokidar, 'watch').callsFake(() => {
      const mockWatcher = {
        on: (event, fn) => {
          if (event === 'error') {
            fn(new Error('Unexpected error'))
          }
        },
        close: () => ({ catch: () => {} }),
      } as unknown

      return mockWatcher as chokidar.FSWatcher
    })

    const errorStub = sinon.stub()
    const stub = sinon.stub()
    const dfd = pDefer()

    stub.onFirstCall().callsFake(dfd.resolve)

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: stub,
      onGitInfoChange: sinon.stub(),
      onError: errorStub,
    })

    const result = await dfd.promise

    expect(result).to.eq((await git.branch()).current)

    expect(errorStub).to.be.callCount(1)
  })

  context('Git Hashes - no fake timers', () => {
    it('does not include commits that are part of the Git tree from a merge', async () => {
      const dfd = pDefer()

      const logCallback = sinon.stub()

      logCallback.onFirstCall().callsFake(dfd.resolve)

      const mainBranch = (await git.branch()).current

      await git.checkoutLocalBranch('feature-branch')

      await git.checkout(mainBranch)

      const newSpec = toPosix(path.join(e2eFolder, 'new.cy.js'))

      await fs.createFile(newSpec)

      await git.add([newSpec])

      await git.commit('add new spec')

      const hashFromMerge = (await git.revparse('HEAD')).trim()

      await git.checkout('feature-branch')

      const featureSpec = toPosix(path.join(e2eFolder, 'feature.cy.js'))

      await fs.createFile(featureSpec)

      await git.add([featureSpec])
      await git.commit('add feature spec')

      await git.merge([mainBranch, '--commit'])

      gitInfo = new GitDataSource({
        isRunMode: false,
        projectRoot: projectPath,
        onBranchChange: sinon.stub(),
        onGitInfoChange: sinon.stub(),
        onError: sinon.stub(),
        onGitLogChange: logCallback,
      })

      await dfd.promise

      expect(gitInfo.currentHashes).to.have.length(3)
      expect(gitInfo.currentHashes).not.to.contain(hashFromMerge)
    })
  })
})
