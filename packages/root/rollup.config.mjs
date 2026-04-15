import json from '@rollup/plugin-json'
import { execSync } from 'child_process'

const SENTINEL_VERSION = '0.0.0-development'

/**
 * Finds the latest stable release version from git tags (e.g. "15.13.1").
 * Used to replace the sentinel during development builds so that consumers
 * always receive a real semver rather than the sentinel.
 */
function getLatestReleasedVersion () {
  try {
    const output = execSync('git tag --list --sort=-version:refname', { encoding: 'utf8' })
    const tag = output.trim().split('\n').find((t) => /^v\d+\.\d+\.\d+$/.test(t))

    return tag ? tag.slice(1) : null
  } catch {
    return null
  }
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

        const version = getLatestReleasedVersion()

        if (!version) {
          return null
        }

        // Replace every occurrence (version appears once in the inlined JSON,
        // but guard against any extras by splitting instead of a single replace)
        return code.split(sentinelLiteral).join(`"${version}"`)
      },
    },
  ],
}
