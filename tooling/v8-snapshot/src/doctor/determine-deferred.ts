import { strict as assert } from 'assert'
import debug from 'debug'
import fs from 'fs'
import path from 'path'
import { SnapshotDoctor } from './snapshot-doctor'
import { canAccess, createHashForFile, matchFileHash } from '../utils'

const logInfo = debug('cypress:snapgen:info')

export async function determineDeferred (
  bundlerPath: string,
  projectBaseDir: string,
  snapshotEntryFile: string,
  cacheDir: string,
  opts: {
    nodeModulesOnly: boolean
    previousDeferred: Set<string>
    previousHealthy: Set<string>
    previousNoRewrite: Set<string>
    forceNoRewrite: Set<string>
    useHashBasedCache: boolean
    nodeEnv: string
  },
) {
  const jsonPath = path.join(cacheDir, 'snapshot-meta.json')

  let hashFilePath: string | undefined
  let hash

  if (opts.useHashBasedCache) {
    hashFilePath = await findHashFile(projectBaseDir)
    assert(
      hashFilePath != null,
      `Unable to find hash file inside ${projectBaseDir}`,
    )

    const {
      match,
      hash: currentHash,
      deferred,
      norewrite,
      healthy,
    } = await validateExistingDeferred(jsonPath, hashFilePath)

    if (match && opts.nodeModulesOnly) {
      const combined: Set<string> = new Set([
        ...norewrite,
        ...opts.forceNoRewrite,
      ])

      return {
        norewrite: Array.from(combined),
        deferred,
        healthy,
      }
    }

    hash = currentHash
  }

  logInfo(
    'Did not find valid excludes for current project state, will determine them ...',
  )

  const doctor = new SnapshotDoctor({
    bundlerPath,
    entryFilePath: snapshotEntryFile,
    baseDirPath: projectBaseDir,
    nodeModulesOnly: opts.nodeModulesOnly,
    previousDeferred: opts.previousDeferred,
    previousHealthy: opts.previousHealthy,
    previousNoRewrite: opts.previousNoRewrite,
    forceNoRewrite: opts.forceNoRewrite,
    nodeEnv: opts.nodeEnv,
    supportTypeScript: opts.nodeModulesOnly,
  })

  const {
    deferred: updatedDeferred,
    norewrite: updatedNorewrite,
    healthy: updatedHealty,
  } = await doctor.heal()
  const deferredHashFile = opts.useHashBasedCache
    ? path.relative(projectBaseDir, hashFilePath!)
    : '<not used>'

  const cachedDeferred = {
    norewrite: updatedNorewrite,
    deferred: updatedDeferred,
    healthy: updatedHealty,
    deferredHashFile,
    deferredHash: hash,
  }

  await fs.promises.writeFile(
    jsonPath,
    JSON.stringify(cachedDeferred, null, 2),
    'utf8',
  )

  return {
    norewrite: updatedNorewrite,
    deferred: updatedDeferred,
    healthy: updatedHealty,
  }
}

async function validateExistingDeferred (
  jsonPath: string,
  hashFilePath: string,
) {
  if (!(await canAccess(jsonPath))) {
    const hash = await createHashForFile(hashFilePath)

    return { deferred: [], match: false, hash }
  }

  const { deferredHash, norewrite, deferred, healthy } = require(jsonPath)
  const res = await matchFileHash(hashFilePath, deferredHash)

  return {
    norewrite,
    deferred,
    match: res.match,
    hash: res.hash,
    healthy,
  }
}

async function findHashFile (projectBaseDir: string) {
  const yarnLock = path.join(projectBaseDir, 'yarn.lock')
  const packageLock = path.join(projectBaseDir, 'package.json.lock')
  const packageJson = path.join(projectBaseDir, 'package.json')

  for (const x of [yarnLock, packageLock, packageJson]) {
    if (await canAccess(x)) return x
  }

  return
}
