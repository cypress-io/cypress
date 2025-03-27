import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import pDefer, { DeferredPromise } from 'p-defer'

import { SimpleGit } from 'simple-git'
import type { GitDataSource, GitDataSourceConfig } from '../../../src/sources/GitDataSource'
import Chokidar from 'chokidar'

use(sinonChai)

type P<F extends keyof SimpleGit> = Parameters<SimpleGit[F]>
type R<F extends keyof SimpleGit> = ReturnType<SimpleGit[F]>

interface GitDataSourceConstructor {
  new (config: GitDataSourceConfig): GitDataSource
}

type GDSImport = {
  GitDataSource: GitDataSourceConstructor
}

describe('GitDataSource', () => {
  let stubbedSimpleGit: {
    // Parameters<> only gets the last overload defined, which is
    // supposed to be the most permissive. However, SimpleGit defines
    // overloads in the opposite order, and we need the one that takes
    // a string.
    revparse: sinon.SinonStub<[option: string], R<'revparse'>>
    branch: sinon.SinonStub<P<'branch'>, R<'branch'>>
    status: sinon.SinonStub<P<'status'>, R<'status'>>
    log: sinon.SinonStub<P<'log'>, R<'log'>>
  }
  let stubbedWatchInstance: sinon.SinonStubbedInstance<Chokidar.FSWatcher>

  let gitDataSourceImport: GDSImport
  let fakeTimers: sinon.SinonFakeTimers

  beforeEach(() => {
    fakeTimers = sinon.useFakeTimers()
    stubbedSimpleGit = {
      revparse: sinon.stub<[option: string], R<'revparse'>>(),
      branch: sinon.stub<P<'branch'>, R<'branch'>>(),
      status: sinon.stub<P<'status'>, R<'status'>>(),
      log: sinon.stub<P<'log'>, R<'log'>>(),
    }

    stubbedWatchInstance = sinon.createStubInstance(Chokidar.FSWatcher)
    sinon.stub(Chokidar, 'watch').returns(stubbedWatchInstance)

    gitDataSourceImport = proxyquire.noCallThru()('../../../src/sources/GitDataSource', {
      'simple-git' () {
        return stubbedSimpleGit
      },
    })
  })

  afterEach(() => {
    sinon.restore()
    fakeTimers.restore()
  })

  describe('Unit', () => {
    describe('in open mode', () => {
      let gds: GitDataSource
      let projectRoot: string
      let branchName: string
      let onBranchChange: sinon.SinonStub<[branch: string | null], void>
      let onGitInfoChange: sinon.SinonStub<[specPath: string[]], void>
      let onError: sinon.SinonStub<[err: any], void>
      let onGitLogChange: sinon.SinonStub<[shas: string[]], void>
      const firstHashes = [
        { hash: 'abc' },
      ]
      const firstHashesReturnValue = ['abc']
      const secondHashes = [...firstHashes, { hash: 'efg' }]
      const secondHashesReturnValue = [...firstHashesReturnValue, 'efg']
      let firstGitLogCall: DeferredPromise<void>
      let secondGitLogCall: DeferredPromise<void>

      beforeEach(async () => {
        firstGitLogCall = pDefer()
        secondGitLogCall = pDefer()
        branchName = 'main'
        onBranchChange = sinon.stub()
        onGitInfoChange = sinon.stub()
        onError = sinon.stub()
        onGitLogChange = sinon.stub()

        projectRoot = '/root'

        // @ts-ignore
        stubbedSimpleGit.log.onFirstCall()
        // @ts-expect-error
        .callsFake(() => {
          firstGitLogCall.resolve()

          return { all: firstHashes }
        })
        .onSecondCall()
        // @ts-expect-error
        .callsFake(() => {
          secondGitLogCall.resolve()

          return { all: secondHashes }
        })

        // #verifyGitRepo

        // constructor verifies the repo in open mode via #refreshAllGitData, but does not wait for it :womp:
        const revparseP = pDefer<void>()

        // SimpleGit returns a chainable, but we only care about the promise
        // @ts-expect-error
        stubbedSimpleGit.revparse.callsFake(() => {
          revparseP.resolve()

          return Promise.resolve(projectRoot)
        })

        // wait for revparse to be called, so we can be assured that GitDataSource has initialized
        // up to this point

        // #loadAndWatchCurrentBranch

        // next in initialization, it loads the current branch
        const branchP = pDefer<void>()

        // again, ignoring type warning re: chaining
        // @ts-expect-error
        stubbedSimpleGit.branch.callsFake(() => {
          branchP.resolve()

          return Promise.resolve({ current: branchName })
        })

        const onBranchChangeP = pDefer<void>()

        onBranchChange.callsFake(() => onBranchChangeP.resolve())

        gds = new gitDataSourceImport.GitDataSource({
          isRunMode: false,
          projectRoot,
          onBranchChange,
          onGitInfoChange,
          onError,
          onGitLogChange,
        })

        await revparseP.promise
        await branchP.promise
        await onBranchChangeP.promise
        expect(onBranchChange).to.be.calledWith(branchName)
      })

      describe('.get currentHashes', () => {
        describe('after first load', () => {
          beforeEach(async () => {
            await firstGitLogCall.promise
          })

          it('returns the current hashes', () => {
            expect(gds.currentHashes).to.have.same.members(firstHashesReturnValue)
          })
        })

        describe('after sixty seconds, when there are additional hashes', () => {
          it('returns the current hashes', async () => {
            await fakeTimers.tickAsync(60001)
            await secondGitLogCall.promise
            expect(gds.currentHashes).to.have.same.members(secondHashesReturnValue)
          })
        })
      })
    })
  })
})
