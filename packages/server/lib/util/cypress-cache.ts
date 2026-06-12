import path from 'path'
import cachedir from 'cachedir'
import untildify from 'untildify'

// Matches the CLI's getEnv(varName, /* trim */ true) / dequote() in
// cli/lib/tasks/state.ts so the server and CLI resolve identical paths.
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

/**
 * Resolve the root Cypress cache directory.
 *
 * Honors CYPRESS_CACHE_FOLDER (and the npm_config_* variants) exactly as the
 * CLI's `state.getCacheDir()` does, so anything anchored here — installed
 * binaries, bundles, runner discovery records — resolves to the same path
 * whether it's the server or the CLI doing the lookup.
 */
export const resolveCypressCacheRoot = (): string => {
  const override = readEnvVar('CYPRESS_CACHE_FOLDER')

  if (override) {
    return path.resolve(untildify(override))
  }

  return cachedir('Cypress')
}
