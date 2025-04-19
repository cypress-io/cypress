import debug from 'debug'
import fs from 'fs'
import path from 'path'
import { SnapshotDoctor } from './snapshot-doctor'
import { canAccess, createHashForFile, matchFileHash } from '../utils'

const logInfo = debug('cypress:snapgen:info')

/**
 * Filters out force no rewrite modules that are not in the project
 * @param norewrite - The set of calculated no rewrite modules in the project
 * @param forceNoRewrite - The set of force no rewrite modules
 */
function filterForceNoRewrite (norewrite: string[], forceNoRewrite: Set<string>) {
  return norewrite.filter((dependency) => {
    // Remove the leading './' from the dependency
    const trimmedDependency = dependency.slice(2)

    // Keep the files that start with packages as their paths are explicit
    // Otherwise, the files are assumed to be in node_modules and we filter out
    // the ones that are in the force no rewrite set (e.g. force no rewrite of 'force-no-rewrite.js'
    // will be 'node_modules/force-no-rewrite.js')
    return trimmedDependency.startsWith('packages') || !forceNoRewrite.has(trimmedDependency)
  })
}

/**
 * Throws an error if a force no rewrite module is not found in the project
 * @param norewrite - The set of force no rewrite modules
 * @param inputs - The inputs from the esbuild bundle which are actually in the project
 */
function errorOnInvalidForceNoRewrite (norewrite: Set<string>, inputs: Record<string, { fileInfo: { fullPath: string } }>) {
  const inputsKeys = Object.keys(inputs)

  const invalidForceNoRewrites: string[] = []

  Array.from(norewrite).forEach((dependency) => {
    if (!inputsKeys.some((key) => key.endsWith(dependency))) {
      invalidForceNoRewrites.push(dependency)
    }
  })

  if (invalidForceNoRewrites.length > 0) {
    throw new Error(`Force no rewrite dependencies not found in project: ${invalidForceNoRewrites.join(', ')}`)
  }
}

export async function determineDeferred (
  bundlerPath: string,
  projectBaseDir: string,
  snapshotEntryFile: string,
  cacheDir: string,
  opts: {
    nodeModulesOnly: boolean
    forceNoRewrite: Set<string>
    nodeEnv: string
    cypressInternalEnv: string
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
    cypressInternalEnv: opts.cypressInternalEnv,
    supportTypeScript: opts.nodeModulesOnly,
    integrityCheckSource: opts.integrityCheckSource,
  })

  const {
    deferred: updatedDeferred,
    norewrite: updatedNorewrite,
    healthy: updatedHealthy,
    meta: esbuildMeta,
  } = await doctor.heal()

  errorOnInvalidForceNoRewrite(opts.forceNoRewrite, esbuildMeta.inputs)

  const deferredHashFile = path.relative(projectBaseDir, hashFilePath)
  const filteredNoRewrite = filterForceNoRewrite(updatedNorewrite, opts.forceNoRewrite)

  const updatedMeta = {
    norewrite: opts.nodeModulesOnly ? [...filteredNoRewrite, ...projectNoRewrite] : filteredNoRewrite,
    deferred: opts.nodeModulesOnly ? [...updatedDeferred, ...projectDeferred] : updatedDeferred,
    healthy: opts.nodeModulesOnly ? [...updatedHealthy, ...projectHealthy] : updatedHealthy,
    deferredHashFile,
    deferredHash: currentHash,
  }

  const updateMetafile = process.env.V8_UPDATE_METAFILE && ['1', 'true'].includes(process.env.V8_UPDATE_METAFILE)
  const generateFromScratch = process.env.V8_SNAPSHOT_FROM_SCRATCH && ['1', 'true'].includes(process.env.V8_SNAPSHOT_FROM_SCRATCH)

  // Only update the metafile if we are generating the full snapshot and we have either explicitly requested to update it or generating from scratch
  if (!opts.nodeModulesOnly && (updateMetafile || generateFromScratch)) {
    await fs.promises.writeFile(
      jsonPath,
      JSON.stringify(updatedMeta, null, 2),
      'utf8',
    )
  }

  return {
    norewrite: updatedNorewrite,
    deferred: updatedDeferred,
    healthy: updatedHealthy,
  }
}

async function findHashFile (projectBaseDir: string) {
  return path.join(projectBaseDir, 'yarn.lock')
}
