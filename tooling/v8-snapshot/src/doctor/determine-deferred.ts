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
    forceNoRewrite: Set<string>
    nodeEnv: string
    integrityCheckSource: string | undefined
  },
) {
  const jsonPath = path.join(cacheDir, 'snapshot-meta.json')
  const usePreviousSnapshotMetadata = (!process.env.V8_SNAPSHOT_FROM_SCRATCH || !['1', 'true'].includes(process.env.V8_SNAPSHOT_FROM_SCRATCH)) && await canAccess(jsonPath)
  const { deferredHash, norewrite, deferred, healthy } = usePreviousSnapshotMetadata ? require(jsonPath) : { deferredHash: '', norewrite: [], deferred: [], healthy: [] }
  const hashFilePath = await findHashFile(projectBaseDir)
  const currentHash = await createHashForFile(hashFilePath)
  const res = await matchFileHash(hashFilePath, deferredHash)

  let nodeModulesHealthy: string[] = []
  let projectHealthy: string[] = []
  let currentHealthy = opts.nodeModulesOnly ? nodeModulesHealthy : healthy

  healthy.forEach((dependency) => {
    if (dependency.includes('node_modules')) {
      nodeModulesHealthy.push(dependency)
    } else {
      projectHealthy.push(dependency)
    }
  })

  let nodeModulesDeferred: string[] = []
  let projectDeferred: string[] = []
  let currentDeferred = opts.nodeModulesOnly ? nodeModulesDeferred : deferred

  deferred.forEach((dependency) => {
    if (dependency.includes('node_modules')) {
      nodeModulesDeferred.push(dependency)
    } else {
      projectDeferred.push(dependency)
    }
  })

  let nodeModulesNoRewrite: string[] = []
  let projectNoRewrite: string[] = []
  let currentNoRewrite = opts.nodeModulesOnly ? nodeModulesNoRewrite : norewrite

  norewrite.forEach((dependency) => {
    if (dependency.includes('node_modules')) {
      nodeModulesNoRewrite.push(dependency)
    } else {
      projectNoRewrite.push(dependency)
    }
  })

  if (res.match && opts.nodeModulesOnly) {
    const combined: Set<string> = new Set([
      ...currentNoRewrite,
      ...opts.forceNoRewrite,
    ])

    return {
      norewrite: Array.from(combined),
      deferred: currentDeferred,
      healthy: currentHealthy,
    }
  }

  logInfo(
    'Did not find valid excludes for current project state, will determine them ...',
  )

  const doctor = new SnapshotDoctor({
    bundlerPath,
    entryFilePath: snapshotEntryFile,
    baseDirPath: projectBaseDir,
    nodeModulesOnly: opts.nodeModulesOnly,
    previousDeferred: currentDeferred,
    previousHealthy: currentHealthy,
    previousNoRewrite: currentNoRewrite,
    forceNoRewrite: opts.forceNoRewrite,
    nodeEnv: opts.nodeEnv,
    supportTypeScript: opts.nodeModulesOnly,
    integrityCheckSource: opts.integrityCheckSource,
  })

  const {
    deferred: updatedDeferred,
    norewrite: updatedNorewrite,
    healthy: updatedHealty,
  } = await doctor.heal()
  const deferredHashFile = path.relative(projectBaseDir, hashFilePath)

  const updatedMeta = {
    norewrite: opts.nodeModulesOnly ? [...updatedNorewrite, ...projectNoRewrite] : updatedNorewrite,
    deferred: opts.nodeModulesOnly ? [...updatedDeferred, ...projectDeferred] : updatedDeferred,
    healthy: opts.nodeModulesOnly ? [...updatedHealty, ...projectHealthy] : updatedHealty,
    deferredHashFile,
    deferredHash: currentHash,
  }

  if (!opts.nodeModulesOnly && process.env.V8_UPDATE_METAFILE && ['1', 'true'].includes(process.env.V8_UPDATE_METAFILE)) {
    await fs.promises.writeFile(
      jsonPath,
      JSON.stringify(updatedMeta, null, 2),
      'utf8',
    )
  }

  return {
    norewrite: updatedNorewrite,
    deferred: updatedDeferred,
    healthy: updatedHealty,
  }
}

async function findHashFile (projectBaseDir: string) {
  return path.join(projectBaseDir, 'yarn.lock')
}
