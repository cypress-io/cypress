import { describe, expect, it, jest } from '@jest/globals'
import pDefer, { DeferredPromise } from 'p-defer'
import EventEmitter from 'events'

import type { SimpleGit } from 'simple-git'
import { GitDataSource } from '../../../src/sources/GitDataSource'
import Chokidar from 'chokidar'

const stubbedSimpleGit: {
  // Parameters<> only gets the last overload defined, which is
  // supposed to be the most permissive. However, SimpleGit defines
  // overloads in the opposite order, and we need the one that takes
  // a string.
  revparse: jest.Mock<(option: string) => R<'revparse'>>
  branch: jest.Mock<(options: P<'branch'>) => R<'branch'>>
  status: jest.Mock<(options: P<'status'>) => R<'status'>>
  log: jest.Mock<(options: P<'log'>) => R<'log'>>
} = {
  revparse: jest.fn(),
  branch: jest.fn(),
  status: jest.fn(),
  log: jest.fn(),
}

jest.mock('simple-git', () => {
  // use a module factory to return the stubbed SimpleGit instance
  // @see https://jestjs.io/docs/es6-class-mocks#calling-jestmock-with-the-module-factory-parameter
  return jest.fn().mockImplementation(() => {
    return stubbedSimpleGit
  })
})

type P<F extends keyof SimpleGit> = Parameters<SimpleGit[F]>
type R<F extends keyof SimpleGit> = ReturnType<SimpleGit[F]>

describe('GitDataSource', () => {
  beforeEach(() => {
    jest.useFakeTimers()

    // @ts-expect-error - incorrect type to stub
    jest.spyOn(Chokidar, 'watch').mockReturnValue(new EventEmitter())
  })

  afterEach(() => {
    stubbedSimpleGit.log.mockReset()
    stubbedSimpleGit.revparse.mockReset()
    stubbedSimpleGit.branch.mockReset()
    stubbedSimpleGit.status.mockReset()
    jest.useRealTimers()
  })

  describe('Unit', () => {
    describe('in run mode', () => {
      it('does not load git info when setSpecs is called', async () => {
        const revparseP = pDefer<void>()

        stubbedSimpleGit.revparse.mockImplementationOnce((opts: string) => {
          revparseP.resolve()

          return Promise.resolve('/root') as unknown as R<'revparse'>
        })

        const onGitInfoChange = jest.fn()

        const gds = new GitDataSource({
          isRunMode: true,
          projectRoot: '/root',
          onBranchChange: jest.fn(),
          onGitInfoChange,
          onError: jest.fn(),
          onGitLogChange: jest.fn(),
        })

        await revparseP.promise

        gds.setSpecs(['/root/cypress/e2e/spec.cy.ts'])

        // In run mode, setSpecs should be a no-op — no git status or git log calls
        expect(stubbedSimpleGit.status).not.toHaveBeenCalled()
        expect(onGitInfoChange).not.toHaveBeenCalled()

        await gds.destroy()
      })
    })

    describe('in open mode', () => {
      let gds: GitDataSource
      let projectRoot: string
      let branchName: string
      let onBranchChange: jest.Mock<(branch: string | null) => void>
      let onGitInfoChange: jest.Mock<(specPath: string[]) => void>
      let onError: jest.Mock<(err: any) => void>
      let onGitLogChange: jest.Mock<(shas: string[]) => void>
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
        onBranchChange = jest.fn()
        onGitInfoChange = jest.fn()
        onError = jest.fn()
        onGitLogChange = jest.fn()

        projectRoot = '/root'

        stubbedSimpleGit.log.mockImplementationOnce((opts: P<'log'>) => {
          firstGitLogCall.resolve()

          return { all: firstHashes } as unknown as R<'log'>
        }).mockImplementationOnce((opts: P<'log'>) => {
          secondGitLogCall.resolve()

          return { all: secondHashes } as unknown as R<'log'>
        })

        // #verifyGitRepo

        // constructor verifies the repo in open mode via #refreshAllGitData, but does not wait for it :womp:
        const revparseP = pDefer<void>()

        stubbedSimpleGit.revparse.mockImplementationOnce((opts: string) => {
          revparseP.resolve()

          return Promise.resolve(projectRoot) as unknown as R<'revparse'>
        })

        // wait for revparse to be called, so we can be assured that GitDataSource has initialized
        // up to this point

        // #loadAndWatchCurrentBranch

        // next in initialization, it loads the current branch
        const branchP = pDefer<void>()

        // again, ignoring type warning re: chaining
        stubbedSimpleGit.branch.mockImplementationOnce((opts: P<'branch'>) => {
          branchP.resolve()

          return Promise.resolve({ current: branchName }) as unknown as R<'branch'>
        })

        const onBranchChangeP = pDefer<void>()

        onBranchChange.mockImplementationOnce(() => onBranchChangeP.resolve())

        gds = new GitDataSource({
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
        expect(onBranchChange).toHaveBeenCalledWith(branchName)
      })

      describe('.get currentHashes', () => {
        describe('after first load', () => {
          beforeEach(async () => {
            await firstGitLogCall.promise
          })

          it('returns the current hashes', () => {
            expect(gds.currentHashes).toEqual(firstHashesReturnValue)
          })
        })

        describe('after sixty seconds, when there are additional hashes', () => {
          it('returns the current hashes', async () => {
            await jest.advanceTimersByTimeAsync(60001)
            await secondGitLogCall.promise
            expect(gds.currentHashes).toEqual(secondHashesReturnValue)
          })
        })
      })
    })
  })
})
