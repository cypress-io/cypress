import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import os from 'os'
import { simpleGit } from 'simple-git'
import fs from 'fs-extra'
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

    await git.init()

    // scope the identity to this throwaway repo. Writing it to the global
    // gitconfig would leave the machine committing as `Test User` afterwards,
    // and signing is irrelevant here but fails without the machine's key
    await git.addConfig('user.name', 'Test User')
    await git.addConfig('user.email', 'test-user@example.com')
    await git.addConfig('commit.gpgsign', 'false')

    await git.add(allSpecs.map((spec) => path.join(e2eFolder, spec)))
    await git.commit('add all specs')
  })

  afterEach(async () => {
    if (gitInfo) {
      await gitInfo.destroy()
    }

    gitInfo = undefined
  })

  it(`gets correct status for files on ${os.platform()}`, async function () {
    const onBranchChange = vi.fn()
    const dfd = Promise.withResolvers()

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

    expect(gitInfoChangeResolve).toEqual([fooSpec, aRecordSpec, xhrSpec])

    const created = gitInfo.gitInfoFor(fooSpec)!
    const unmodified = gitInfo.gitInfoFor(aRecordSpec)!
    const modified = gitInfo.gitInfoFor(xhrSpec)!

    expect(created.lastModifiedHumanReadable).toMatch(/(a few|\d) seconds? ago/)
    expect(created.statusType).toEqual('created')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(created.author).not.toBeUndefined()
    expect(created.lastModifiedTimestamp).not.toBeUndefined()

    expect(unmodified.lastModifiedHumanReadable).toMatch(/(a few|\d) seconds? ago/)
    expect(unmodified.statusType).toEqual('unmodified')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(unmodified.author).not.toBeUndefined()
    expect(unmodified.lastModifiedTimestamp).not.toBeUndefined()

    expect(modified.lastModifiedHumanReadable).toMatch(/(a few|\d) seconds? ago/)
    expect(modified.statusType).toEqual('modified')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(modified.author).not.toBeUndefined()
    expect(modified.lastModifiedTimestamp).not.toBeUndefined()
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

    const dfd = Promise.withResolvers()

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: vi.fn(),
      onGitInfoChange: dfd.resolve,
      onError: vi.fn(),
    })

    await Promise.all(
      filepaths.map((filepath) => fs.createFile(filepath)),
    )

    gitInfo.setSpecs(filepaths)

    await dfd.promise

    const results = filepaths.map((filepath) => {
      return gitInfo.gitInfoFor(filepath)
    })

    expect(results).toHaveLength(filepaths.length)

    filepaths.forEach((filepath, index) => {
      const result = results[index]

      expect(result?.lastModifiedHumanReadable).toMatch(/(a few|\d) seconds? ago/)
      expect(result?.statusType).toEqual('created')
    })
  })

  it(`reads committed files whose names contain shell or pathspec syntax as literal paths on ${os.platform()}`, async () => {
    const filenames = [
      'pwn$(touch${IFS}injected).cy.js',
      'pwn`touch${IFS}injected`.cy.js',
      'file withSpace.cy.js',
      'file\'withOneSingleQuote.cy.js',
      '[xy].cy.js',
    ]

    if (os.platform() !== 'win32') {
      // Double quote not a legal character on NTFS
      filenames.push('file"withOneDoubleQuote.cy.js')
    }

    const specs = filenames.map((filename) => toPosix(path.join(e2eFolder, filename)))

    await Promise.all(specs.map((spec) => fs.createFile(spec)))
    await git.add(specs)
    await git.commit('add specs with special names')

    // a later commit that `[xy].cy.js` would match if it were read as a glob
    const globMatch = path.join(e2eFolder, 'x.cy.js')

    await fs.createFile(globMatch)
    await git.add([globMatch])
    await git.commit('add glob match')

    const projectContents = await fs.readdir(projectPath)
    const dfd = Promise.withResolvers()

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: vi.fn(),
      onGitInfoChange: dfd.resolve,
      onError: vi.fn(),
    })

    gitInfo.setSpecs(specs)

    await dfd.promise

    expect(await fs.readdir(projectPath)).toEqual(projectContents)

    for (const spec of specs) {
      expect(gitInfo.gitInfoFor(spec)).toMatchObject({
        statusType: 'unmodified',
        author: 'Test User',
        subject: 'add specs with special names',
      })
    }
  })

  describe('reading the last commit of a committed spec', () => {
    const HOUR = 60 * 60 * 1000
    const DAY = 24 * HOUR

    const commitSpec = async (filename: string, { author, ageMs, subject }: { author: string, ageMs: number, subject: string }) => {
      const spec = toPosix(path.join(e2eFolder, filename))
      const date = new Date(Date.now() - ageMs).toISOString()

      await fs.createFile(spec)
      await git.add([spec])
      await git.commit(subject, [spec], { '--author': `${author} <${author.toLowerCase().replace(' ', '.')}@example.com>`, '--date': date })

      const [timestamp, shortHash] = (await git.raw(['log', '-1', '--pretty=format:%ci|%h', '--', spec])).split('|')

      return { spec, timestamp, shortHash }
    }

    const loadGitInfo = async (specs: string[]) => {
      const dfd = Promise.withResolvers()

      gitInfo = new GitDataSource({
        isRunMode: false,
        projectRoot: projectPath,
        onBranchChange: vi.fn(),
        onGitInfoChange: dfd.resolve,
        onError: vi.fn(),
      })

      gitInfo.setSpecs(specs)

      await dfd.promise
    }

    it('reads the timestamp, age, author, short hash and subject', async () => {
      const { spec, timestamp, shortHash } = await commitSpec('typical.cy.js', { author: 'Marisol Okafor', ageMs: 2 * DAY + HOUR, subject: 'add typical spec' })

      await loadGitInfo([spec])

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+]\d{4}$/)
      expect(gitInfo.gitInfoFor(spec)).toEqual({
        lastModifiedTimestamp: timestamp,
        lastModifiedHumanReadable: '2 days ago',
        author: 'Marisol Okafor',
        statusType: 'unmodified',
        subject: 'add typical spec',
        shortHash,
      })
    })

    it('reads a commit dated after the local clock, which git words as "in the future"', async () => {
      const { spec, timestamp, shortHash } = await commitSpec('future.cy.js', { author: 'Priya Natarajan', ageMs: -3 * HOUR - 60 * 1000, subject: 'add spec from a skewed clock' })

      await loadGitInfo([spec])

      expect(gitInfo.gitInfoFor(spec)).toEqual({
        lastModifiedTimestamp: timestamp,
        lastModifiedHumanReadable: 'in 3 hours',
        author: 'Priya Natarajan',
        statusType: 'unmodified',
        subject: 'add spec from a skewed clock',
        shortHash,
      })
    })

    it('keeps an author whose first name ends in "ago" out of the age', async () => {
      const { spec } = await commitSpec('iago.cy.js', { author: 'Iago Smith', ageMs: 2 * DAY + HOUR, subject: 'add iago spec' })

      await loadGitInfo([spec])

      expect(gitInfo.gitInfoFor(spec)).toMatchObject({
        lastModifiedHumanReadable: '2 days ago',
        author: 'Iago Smith',
        subject: 'add iago spec',
      })
    })

    it('reads the subject up to the first "|"', async () => {
      const { spec, shortHash } = await commitSpec('pipe.cy.js', { author: 'Test User', ageMs: 2 * DAY + HOUR, subject: 'fix a|b ago c|d' })

      await loadGitInfo([spec])

      expect(gitInfo.gitInfoFor(spec)).toMatchObject({
        lastModifiedHumanReadable: '2 days ago',
        author: 'Test User',
        shortHash,
        subject: 'fix a',
      })
    })
  })

  it(`watches switching branches on ${os.platform()}`, async () => {
    const stub = vi.fn()
    const dfd = Promise.withResolvers()

    stub.mockImplementationOnce(dfd.resolve)

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: stub,
      onGitInfoChange: vi.fn(),
      onError: vi.fn(),
    })

    const result = await dfd.promise

    expect(result).toEqual((await git.branch()).current)

    const switchBranch = Promise.withResolvers()

    stub.mockImplementationOnce(switchBranch.resolve)

    git.checkoutLocalBranch('testing123')
    expect(await switchBranch.promise).toEqual('testing123')
  })

  it(`handles error while watching .git on ${os.platform()}`, async () => {
    vi.spyOn(chokidar, 'watch').mockImplementation(() => {
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

    const errorStub = vi.fn()
    const stub = vi.fn()
    const dfd = Promise.withResolvers()

    stub.mockImplementationOnce(dfd.resolve)

    gitInfo = new GitDataSource({
      isRunMode: false,
      projectRoot: projectPath,
      onBranchChange: stub,
      onGitInfoChange: vi.fn(),
      onError: errorStub,
    })

    const result = await dfd.promise

    expect(result).toEqual((await git.branch()).current)

    expect(errorStub).toHaveBeenCalledTimes(1)
  })

  describe('Git Hashes - no fake timers', () => {
    it('does not include commits that are part of the Git tree from a merge', async () => {
      const dfd = Promise.withResolvers()

      const logCallback = vi.fn()

      logCallback.mockImplementationOnce(dfd.resolve)

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
        onBranchChange: vi.fn(),
        onGitInfoChange: vi.fn(),
        onError: vi.fn(),
        onGitLogChange: logCallback,
      })

      await dfd.promise

      expect(gitInfo.currentHashes).toHaveLength(3)
      expect(gitInfo.currentHashes).not.toContain(hashFromMerge)
    })
  })
})
