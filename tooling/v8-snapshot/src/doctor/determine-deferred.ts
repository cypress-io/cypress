import debug from 'debug'
import fs from 'fs'
import path from 'path'
import { doesDependencyMatchForceNorewriteEntry, SnapshotDoctor } from './snapshot-doctor'
import { canAccess, createHashForFile, matchFileHash } from '../utils'

const logInfo = debug('cypress:snapgen:info')

interface ErrorOnInvalidForceNorewriteOpts {
  forceNorewrite: Set<string>
  inputs: Record<string, { fileInfo: { fullPath: string } }>
  nodeModulesOnly: boolean
}

/**
 * Filters out the wildcard force no rewrite modules
 * @param norewrite - The set of calculated no rewrite modules in the project
 */
function filterForceNorewrite (norewrite: string[]) {
  return norewrite.filter((dependency) => !dependency.startsWith('./*'))
}

/**
 * Throws an error if a force no rewrite module is not found in the project
 * @param norewrite - The set of force no rewrite modules
 * @param inputs - The inputs from the esbuild bundle which are actually in the project
 */
function errorOnInvalidForceNorewrite (opts: ErrorOnInvalidForceNorewriteOpts) {
  const inputsKeys = Object.keys(opts.inputs)

  const invalidForceNorewrites: string[] = []

  Array.from(opts.forceNorewrite).forEach((dependency) => {
    if (opts.nodeModulesOnly && !dependency.startsWith('node_modules') && !dependency.startsWith('*')) {
      return
    }

    const includedInInputs = inputsKeys.some((key) => {
      return doesDependencyMatchForceNorewriteEntry(key, dependency)
    })

    if (!includedInInputs) {
      invalidForceNorewrites.push(dependency)
    }
  })

  if (invalidForceNorewrites.length > 0) {
    throw new Error(`Force no rewrite dependencies not found in project: ${invalidForceNorewrites.join(', ')}`)
  }
}

export async function determineDeferred (
  bundlerPath: string,
  projectBaseDir: string,
  snapshotEntryFile: string,
  cacheDir: string,
  opts: {
    nodeModulesOnly: boolean
    forceNorewrite: Set<string>
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

  let nodeModulesNorewrite: string[] = []
  let projectNorewrite: string[] = []
  let currentNorewrite = opts.nodeModulesOnly ? nodeModulesNorewrite : norewrite

  norewrite.forEach((dependency) => {
    if (dependency.includes('node_modules')) {
      nodeModulesNorewrite.push(dependency)
    } else {
      projectNorewrite.push(dependency)
    }
  })

  if (res.match && opts.nodeModulesOnly) {
    const combined: Set<string> = new Set([
      ...currentNorewrite,
      ...opts.forceNorewrite,
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
    previousNorewrite: currentNorewrite,
    forceNorewrite: opts.forceNorewrite,
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

  errorOnInvalidForceNorewrite({
    forceNorewrite: opts.forceNorewrite,
    inputs: esbuildMeta.inputs,
    nodeModulesOnly: opts.nodeModulesOnly,
  })

  const deferredHashFile = path.relative(projectBaseDir, hashFilePath)
  const filteredNorewrite = filterForceNorewrite(updatedNorewrite)

  const updatedMeta = {
    norewrite: opts.nodeModulesOnly ? [...filteredNorewrite, ...projectNorewrite] : filteredNorewrite,
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
    norewrite: filteredNorewrite,
    deferred: updatedDeferred,
    healthy: updatedHealthy,
  }
}

async function findHashFile (projectBaseDir: string) {
  return path.join(projectBaseDir, 'yarn.lock')
}
