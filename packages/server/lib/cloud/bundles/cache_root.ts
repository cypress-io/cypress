import path from 'path'
import cachedir from 'cachedir'
import untildify from 'untildify'

const BUNDLES_DIRNAME = 'bundles'

// Strip a single pair of surrounding double quotes -- mirrors the CLI's
// dequote() so values like Windows CMD's `set FOO="C:\path"` resolve
// correctly. https://github.com/cypress-io/cypress/issues/4506
const dequote = (str: string): string => {
  if (str.length > 1 && str[0] === '"' && str[str.length - 1] === '"') {
    return str.slice(1, -1)
  }

  return str
}

// Mirrors cli/lib/util.ts `getEnv()`: checks the env var, then the
// npm_config_* / npm_package_config_* fallbacks (so values from .npmrc or
// `--cypress-cache-folder=...` reach the server), trims whitespace, and
// strips wrapping double quotes before returning.
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
