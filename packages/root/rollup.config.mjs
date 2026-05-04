import json from '@rollup/plugin-json'
import { execSync } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SENTINEL_VERSION = '0.0.0-development'

/**
 * Computes the next Cypress release version using the same script that drives
 * the binary and CLI release pipeline. Used to replace the 0.0.0-development
 * sentinel during development builds so that consumers (e.g. Cloud API headers)
 * always identify with the version currently being developed.
 *
 * Throws if the version cannot be resolved so that a broken sentinel is never
 * silently shipped in the bundle.
 */
function getNextVersion () {
  const scriptPath = resolve(__dirname, '../../scripts/get-next-version.js')

  return execSync(`node "${scriptPath}"`, { encoding: 'utf8' }).trim()
}

export default {
  input: 'index.ts',
  // inlines the root package.json into the bundle
  plugins: [
    json(),
    {
      name: 'resolve-sentinel-version',
      renderChunk (code) {
        const sentinelLiteral = `"${SENTINEL_VERSION}"`

        if (!code.includes(sentinelLiteral)) {
          return null
        }

        // Throws if get-next-version.js fails — a broken sentinel must never
        // be silently shipped in the bundle.
        const version = getNextVersion()

        // Replace every occurrence (version appears once in the inlined JSON,
        // but guard against any extras by splitting instead of a single replace)
        return code.split(sentinelLiteral).join(`"${version}"`)
      },
    },
  ],
}
