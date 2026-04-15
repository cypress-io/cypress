import pkg from '../../package.json'

// When running from source in development, the root package.json version is the
// sentinel `0.0.0-development`. Exporting it as-is causes cloud API calls to send
// `x-cypress-version: 0.0.0-development`, which the cloud does not recognise as a
// valid release version and responds differently (e.g. Studio behaves unexpectedly).
//
// Replace the sentinel with a real-looking development version so cloud APIs behave
// consistently in dev mode. Update DEVELOPMENT_VERSION when cutting a new major release.
const SENTINEL_VERSION = '0.0.0-development'
const DEVELOPMENT_VERSION = '15.13.1'

export default {
  ...pkg,
  version: pkg.version === SENTINEL_VERSION ? DEVELOPMENT_VERSION : pkg.version,
}
