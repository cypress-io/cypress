import path from 'path'
import os from 'os'
import { ensureDir, remove } from 'fs-extra'
import cachedir from 'cachedir'
import untildify from 'untildify'
import Debug from 'debug'

const debug = Debug('cypress:server:cloud:bundles:cache-root')

const BUNDLES_DIRNAME = 'bundles'

// Matches the CLI's getEnv(varName, /* trim */ true) / dequote() in
// cli/lib/tasks/state.ts so the two sides resolve identical paths.
const dequote = (str: string): string => {
  if (str.length > 1 && str[0] === '"' && str[str.length - 1] === '"') {
    return str.slice(1, -1)
  }

  return str
}

const readEnvVar = (varName: string): string | undefined => {
  const candidates = [
    varName,
    `npm_config_${varName}`,
    `npm_config_${varName.toLowerCase()}`,
    `npm_package_config_${varName}`,
  ]

  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(process.env, candidate)) {
      const raw = process.env[candidate]

      if (raw === undefined) continue

      return dequote(raw.trim())
    }
  }

  return undefined
}

const resolveCypressCacheRoot = (): string => {
  const override = readEnvVar('CYPRESS_CACHE_FOLDER')

  if (override) {
    return path.resolve(untildify(override))
  }

  return cachedir('Cypress')
}

const getBundleCacheRoot = (): string => {
  return path.join(resolveCypressCacheRoot(), BUNDLES_DIRNAME)
}

export const getBundleCacheDir = (kind: 'cy-prompt' | 'studio'): string => {
  return path.join(getBundleCacheRoot(), kind)
}

const getFallbackBundleCacheDir = (kind: 'cy-prompt' | 'studio'): string => {
  return path.join(os.tmpdir(), 'cypress-cache', BUNDLES_DIRNAME, kind)
}

const isPermissionError = (err: unknown): boolean => {
  const code = (err as NodeJS.ErrnoException | null)?.code

  return code === 'EACCES' || code === 'EPERM' || code === 'EROFS'
}

const randomSuffix = (): string => Math.random().toString(36).substring(2, 15)

// `ensureDir` is a no-op on an existing directory and never checks whether we can
// write into it, so confirm writability by creating (and removing) a sentinel
// child — the same `mkdir`-of-a-child operation the bundle flow later performs.
// The `.staging-` prefix means a probe left behind by a failed cleanup is reaped
// by sweepOrphanStaging rather than lingering forever.
const ensureDirWritable = async (dir: string): Promise<void> => {
  await ensureDir(dir)

  const probe = path.join(dir, `.staging-probe-${randomSuffix()}`)

  await ensureDir(probe)
  await remove(probe).catch(() => { /* best-effort cleanup */ })
}

// Ensure a writable bundle cache dir, returning the directory that was created.
// When the configured Cypress cache folder is not writable (e.g. a root-owned or
// read-only cache in locked-down CI), fall back to the OS temp dir rather than
// failing outright.
export const ensureWritableBundleCacheDir = async (kind: 'cy-prompt' | 'studio'): Promise<string> => {
  const primary = getBundleCacheDir(kind)

  try {
    await ensureDirWritable(primary)

    return primary
  } catch (err) {
    if (!isPermissionError(err)) throw err

    const fallback = getFallbackBundleCacheDir(kind)

    debug('bundle cache dir %s not writable (%s); falling back to %s', primary, (err as NodeJS.ErrnoException).code, fallback)
    await ensureDirWritable(fallback)

    return fallback
  }
}
