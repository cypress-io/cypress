import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'

import { determineDeferred, SnapshotMetadata } from '../../src/doctor/determine-deferred'

import fs from 'fs'
import path from 'path'
import { doesDependencyMatchForceNorewriteEntry, SnapshotDoctor } from '../../src/doctor/snapshot-doctor'
import * as utils from '../../src/utils'
import type { Metadata } from '../../src/types'

const { canAccess, createHashForFile, matchFileHash } = utils

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

  let hashFilePath: string
  let currentHash: string
  let matchFileHashResult: Awaited<ReturnType<typeof matchFileHash>>

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

    hashFilePath = path.join(projectBaseDir, 'yarn.lock')

    matchFileHashResult = {
      hash: 'hash',
      match: true,
    }

    ;(matchFileHash as Mock<typeof matchFileHash>).mockResolvedValue(matchFileHashResult)

    vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(void 0)
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

      it('returns only the node_modules dependencies from the previous snapshot metadata', async () => {
        await expect(
          determineDeferred(bundlerPath, projectBaseDir, snapshotEntryFile, cacheDir, opts),
        ).resolves.toEqual({
          deferred: expect.arrayContaining([moduleDeferred]),
          norewrite: expect.arrayContaining([moduleNorewrite]),
          healthy: expect.arrayContaining([moduleHealthy]),
        })
      })
    })

    describe('when not using nodeModulesOnly', () => {
      beforeEach(() => {
        opts.nodeModulesOnly = false
      })

      describe('when doctor.heal() returns no changes', () => {
        beforeEach(() => {
          const meta: Metadata = {
            inputs: {},
            resolverMap: {},
            outputs: {},
          }

          vi.mocked(SnapshotDoctor.prototype.heal).mockResolvedValue({
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
      })
    })
  })
})
