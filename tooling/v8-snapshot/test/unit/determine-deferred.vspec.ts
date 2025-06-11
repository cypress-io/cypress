import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'

import { determineDeferred, SnapshotMetadata } from '../../src/doctor/determine-deferred'

import fs from 'fs'
import * as doctor from '../../src/doctor/snapshot-doctor'
import * as utils from '../../src/utils'
import type { Metadata } from '../../src/types'
import forceDeferredFixtures from '../../test/fixtures/force-deferred.json'
import { forceDeferred } from '../../src/setup/force-deferred'
const { createHashForFile, matchFileHash } = utils
const { SnapshotDoctor } = doctor

expect.extend({
  setContaining<T extends Set<U> | Array<U> | U, U> (received: Set<U>, expected: T) {
    if (!(received instanceof Set)) {
      return { message: () => `expected ${received} to be a Set`, pass: false }
    }

    const notFound: U[] = []
    const coercedExpected: U[] = expected instanceof Set ? Array.from(expected) : expected instanceof Array ? expected : [expected]

    for (const val of coercedExpected) {
      if (!received.has(val)) {
        notFound.push(val)
      }
    }

    return { message: () => `expected ${received} to contain ${expected}`, pass: notFound.length === 0 }
  },
})

declare module 'vitest' {
  interface Assertion {
    setContaining<U> (expected: Set<U> | Array<U> | U): void
  }

  interface AsymmetricMatchers {
    setContaining<U> (expected: Set<U> | Array<U> | U): void
  }

  interface ExpectStatic {
    setContaining<U> (expected: Set<U> | Array<U> | U): void
  }
}

vi.mock('../../src/setup/force-deferred', () => {
  return {
    forceDeferred: vi.fn(),
  }
})

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs')

  return {
    ...actual,
    promises: {
      ...actual.promises,
      writeFile: vi.fn(),
    },
  }
})

vi.mock('../../src/utils', async () => {
  const actual = await vi.importActual<typeof utils>('../../src/utils')

  return {
    ...actual,
    createHashForFile: vi.fn(),
    canAccess: vi.fn(),
    matchFileHash: vi.fn(),
  }
})

vi.mock('../../src/doctor/snapshot-doctor')

describe('determineDeferred', () => {
  let bundlerPath: string
  let projectBaseDir: string
  let snapshotEntryFile: string
  let cacheDir: string
  let opts: {
    nodeModulesOnly: boolean
    forceNorewrite: Set<string>
    nodeEnv: string
    cypressInternalEnv: string
    integrityCheckSource: string | undefined
  }

  let matchFileHashResult: Awaited<ReturnType<typeof matchFileHash>>

  let meta: Metadata

  const projectYarnLockHash = 'projectYarnLockHash'

  beforeEach(() => {
    bundlerPath = 'bundlerPath'
    projectBaseDir = 'projectBaseDir'
    snapshotEntryFile = 'snapshotEntryFile'
    cacheDir = 'cacheDir'

    opts = {
      nodeModulesOnly: true,
      forceNorewrite: new Set(),
      nodeEnv: 'nodeEnv',
      cypressInternalEnv: 'cypressInternalEnv',
      integrityCheckSource: 'integrityCheckSource',
    }

    meta = {
      inputs: {},
      resolverMap: {},
      outputs: {},
    }

    matchFileHashResult = {
      hash: 'hash',
      match: true,
    }

    ;(matchFileHash as Mock<typeof matchFileHash>).mockImplementation(() => {
      return Promise.resolve(matchFileHashResult)
    })

    vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(void 0)

    vi.mocked(forceDeferred).mockReturnValue(forceDeferredFixtures.empty)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('when using previous snapshot metadata', () => {
    let previousSnapshotMetadata: SnapshotMetadata

    let prevEnv: string | undefined

    beforeEach(() => {
      previousSnapshotMetadata = {
        deferredHash: 'deferredHash',
        norewrite: ['norewrite'],
        deferred: ['deferred'],
        healthy: ['healthy'],
      }

      prevEnv = process.env.V8_SNAPSHOT_FROM_SCRATCH

      process.env.V8_SNAPSHOT_FROM_SCRATCH = 'false'

      vi.spyOn(utils, 'canAccess').mockResolvedValue(true)
      vi.spyOn(fs.promises, 'readFile').mockImplementation(() => {
        return Promise.resolve(JSON.stringify(previousSnapshotMetadata))
      })

      ;(createHashForFile as Mock<typeof createHashForFile>).mockImplementation(() => {
        return Promise.resolve(projectYarnLockHash)
      })
    })

    afterEach(() => {
      process.env.V8_SNAPSHOT_FROM_SCRATCH = prevEnv
    })

    describe('when using nodeModulesOnly', () => {
      const moduleHealthy: string = 'node_modules/healthy'
      const moduleDeferred: string = 'node_modules/deferred'
      const moduleNorewrite: string = 'node_modules/norewrite'

      beforeEach(() => {
        opts.nodeModulesOnly = true
        previousSnapshotMetadata.healthy.push(moduleHealthy)
        previousSnapshotMetadata.norewrite.push(moduleNorewrite)
        previousSnapshotMetadata.deferred.push(moduleDeferred)
      })

      describe('when deferred hash matches the project yarn.lock hash', () => {
        beforeEach(() => {
          matchFileHashResult.match = true
        })

        it('returns only the node_modules dependencies from the previous snapshot metadata, and does not call doctor.heal()', async () => {
          await expect(
            determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts),
          ).resolves.toEqual({
            deferred: expect.arrayContaining([moduleDeferred]),
            norewrite: expect.arrayContaining([moduleNorewrite]),
            healthy: expect.arrayContaining([moduleHealthy]),
          })

          expect(SnapshotDoctor.prototype.heal).not.toHaveBeenCalled()
        })
      })

      describe('and hash does not match', () => {
        beforeEach(() => {
          (matchFileHash as Mock<typeof matchFileHash>).mockImplementation(() => {
            return Promise.resolve({
              hash: 'differentHash',
              match: false,
            })
          })
        })

        describe('when doctor.heal() returns meta inputs for each forceNoRewrite entry', () => {
          beforeEach(() => {
            opts.forceNorewrite.add('node_modules/included')

            ;(SnapshotDoctor.prototype.heal as Mock<typeof SnapshotDoctor.prototype.heal>).mockImplementation(() => {
              const ret = {
                healthy: [...previousSnapshotMetadata.healthy, 'newHealthy'],
                deferred: [...previousSnapshotMetadata.deferred, 'newDeferred'],
                norewrite: [...previousSnapshotMetadata.norewrite, 'newNorewrite'],
                bundle: Buffer.from(''),
                meta: {
                  ...meta,
                  inputs: Array.from(opts.forceNorewrite).reduce((prev, dependency) => {
                    return {
                      ...prev,
                      [dependency]: { fileInfo: { fullPath: dependency } },
                    }
                  }, {}),
                },
              }

              return Promise.resolve(ret)
            })
          })

          it('returns the previous snapshot merged with the new changes, without the hash', async () => {
            const { deferredHash, ...previousMetadata } = previousSnapshotMetadata

            const res = await determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts)

            expect(
              res,
            ).toEqual({
              deferred: expect.arrayContaining(['newDeferred']),
              norewrite: expect.arrayContaining(['newNorewrite']),
              healthy: expect.arrayContaining(['newHealthy']),
            })

            expect(res).toEqual({
              deferred: expect.arrayContaining(previousMetadata.deferred),
              norewrite: expect.arrayContaining(previousMetadata.norewrite),
              healthy: expect.arrayContaining(previousMetadata.healthy),
            })
          })
        })

        describe('when doctor.heal() returns inputs that do not include all forceNoRewrite entries', () => {
          beforeEach(() => {
            meta.inputs = {}
            opts.forceNorewrite.add('node_modules/missing-force-norewrite')
            vi.mocked(SnapshotDoctor.prototype.heal).mockResolvedValue({
              healthy: previousSnapshotMetadata.healthy,
              deferred: previousSnapshotMetadata.deferred,
              norewrite: previousSnapshotMetadata.norewrite,
              bundle: Buffer.from(''),
              meta,
            })
          })

          it('throws an error', async () => {
            await expect(
              determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts),
            ).rejects.toThrow()
          })

          describe('and there are non-node_modules entries in forceNorewrite', () => {
            beforeEach(() => {
              opts.forceNorewrite.add('/non-npm')
            })

            it('throws an error', async () => {
              await expect(
                determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts),
              ).rejects.toThrow()
            })
          })
        })
      })
    })

    describe('when not using nodeModulesOnly', () => {
      beforeEach(() => {
        opts.nodeModulesOnly = false
      })

      describe('when doctor.heal() returns no changes', () => {
        beforeEach(() => {
          (SnapshotDoctor.prototype.heal as Mock<typeof SnapshotDoctor.prototype.heal>).mockResolvedValue({
            healthy: previousSnapshotMetadata.healthy,
            deferred: previousSnapshotMetadata.deferred,
            norewrite: previousSnapshotMetadata.norewrite,
            bundle: Buffer.from(''),
            meta,
          })
        })

        it('returns the previous snapshot metadata, without the hash', async () => {
          const { deferredHash, ...previousMetadata } = previousSnapshotMetadata

          await expect(
            determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts),
          ).resolves.toEqual(previousMetadata)
        })

        describe('and updateMetaFile env is true', () => {
          let prevEnv

          beforeEach(() => {
            prevEnv = { ...process.env }
            process.env.V8_UPDATE_METAFILE = 'true'
          })

          afterEach(() => {
            process.env = prevEnv
          })

          describe('and generateFromScratch is true', () => {
            beforeEach(() => {
              process.env.V8_SNAPSHOT_FROM_SCRATCH = 'true'
            })

            it('writes updated meta to file', async () => {
              await determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts)
              const [[snapshotPath, writtenMeta, encoding]] = (fs.promises.writeFile as Mock<typeof fs.promises.writeFile>).mock.calls

              expect(snapshotPath).to.eq('cacheDir/snapshot-meta.json')
              expect(JSON.parse(writtenMeta as string)).toMatchObject({
                ...previousSnapshotMetadata,
                deferredHashFile: 'yarn.lock',
                deferredHash: projectYarnLockHash,
              })

              expect(encoding).to.eq('utf8')
            })
          })

          describe('and generateFromScratch is falsey', () => {
            beforeEach(() => {
              process.env.V8_SNAPSHOT_FROM_SCRATCH = undefined
            })

            it('writes updated meta to file', async () => {
              await determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts)

              const [[snapshotPath, writtenMeta, encoding]] = (fs.promises.writeFile as Mock<typeof fs.promises.writeFile>).mock.calls

              expect(snapshotPath).to.eq('cacheDir/snapshot-meta.json')
              expect(JSON.parse(writtenMeta as string)).toMatchObject({
                ...previousSnapshotMetadata,
                deferredHashFile: 'yarn.lock',
                deferredHash: projectYarnLockHash,
              })

              expect(encoding).to.eq('utf8')
            })
          })
        })

        describe('and updateMetaFile env is false', () => {
          let prevEnv

          beforeEach(() => {
            prevEnv = { ...process.env }
            process.env.V8_UPDATE_METAFAILE = undefined
          })

          afterEach(() => {
            process.env = prevEnv
          })

          describe('and generateFromScratch is true', () => {
            beforeEach(() => {
              process.env.V8_SNAPSHOT_FROM_SCRATCH = 'true'
            })

            it('writes updated meta to file', async () => {
              await determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts)
              const [[snapshotPath, writtenMeta, encoding]] = (fs.promises.writeFile as Mock<typeof fs.promises.writeFile>).mock.calls

              expect(snapshotPath).to.eq('cacheDir/snapshot-meta.json')
              expect(JSON.parse(writtenMeta as string)).toMatchObject({
                ...previousSnapshotMetadata,
                deferredHashFile: 'yarn.lock',
                deferredHash: projectYarnLockHash,
              })

              expect(encoding).to.eq('utf8')
            })
          })

          describe('and generateFromScratch is falsey', () => {
            beforeEach(() => {
              process.env.V8_SNAPSHOT_FROM_SCRATCH = undefined
            })

            it('does not write updated meta to file', async () => {
              await determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts)

              expect(fs.promises.writeFile).not.toHaveBeenCalled()
            })
          })
        })
      })

      describe('when doctor.heal() returns invalid forceNorewrite', () => {
        const meta: Metadata = {
          inputs: {},
          resolverMap: {},
          outputs: {},
        }

        beforeEach(() => {
          vi.mocked(SnapshotDoctor.prototype.heal).mockResolvedValue({
            healthy: previousSnapshotMetadata.healthy,
            deferred: previousSnapshotMetadata.deferred,
            norewrite: previousSnapshotMetadata.norewrite,
            bundle: Buffer.from(''),
            meta,
          })

          opts.forceNorewrite.add('node_modules/missing-deferred')
        })

        it('throws an error', async () => {
          await expect(
            determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts),
          ).rejects.toThrow()
        })
      })
    })
  })

  describe('when not using previous snapshot metadata', () => {
    let prevEnv

    beforeEach(() => {
      prevEnv = process.env.V8_SNAPSHOT_FROM_SCRATCH

      process.env.V8_SNAPSHOT_FROM_SCRATCH = '1'

      vi.spyOn(utils, 'canAccess').mockResolvedValue(false)

      matchFileHashResult.match = false
      opts.nodeModulesOnly = false

      vi.mocked(SnapshotDoctor.prototype.heal).mockResolvedValue({
        healthy: [],
        deferred: [],
        norewrite: [],
        bundle: Buffer.from(''),
        meta,
      })
    })

    afterEach(() => {
      process.env.V8_SNAPSHOT_FROM_SCRATCH = prevEnv
    })

    describe('when there are files that are force-deferred', () => {
      beforeEach(() => {
        vi.mocked(forceDeferred).mockReturnValue(forceDeferredFixtures.withValues)
      })

      it('initializes the doctor with the force-deferred entries in the previousDeferred param', async () => {
        await determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts)

        expect(SnapshotDoctor).toHaveBeenCalledWith(expect.objectContaining({
          previousDeferred: expect.setContaining(forceDeferredFixtures.withValues),
        }))
      })
    })
  })
})
