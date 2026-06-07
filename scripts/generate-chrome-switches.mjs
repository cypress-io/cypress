/* eslint-disable no-console */

// Regenerates packages/server/lib/util/chrome-switches.json — the allowlist of
// valid Chromium command-line switches used by chromium_flags_spec to catch
// typo'd or removed flags in DEFAULT_FLAGS.
//
// Chromium silently ignores unrecognized switches, so a misspelled flag (e.g.
// `disable-prompt-on-repos` instead of `disable-prompt-on-repost`) is a no-op
// with no error. This script extracts the switch string literals defined in
// Chromium's `*_switches.cc` files at a given git ref so we can validate our
// flags against the real, version-matched set.
//
// Usage:
//   node scripts/generate-chrome-switches.mjs --check            # diff committed vs fresh, exit 1 if stale
//   node scripts/generate-chrome-switches.mjs --write            # overwrite the committed allowlist
//   node scripts/generate-chrome-switches.mjs --write --ref <git-ref>
//
// By default the ref is derived from the Chrome version Cypress tests against,
// so the allowlist always tracks the Chrome build under test (and re-pins
// automatically when the browser-version updater bumps it). Chrome versions are
// `MAJOR.MINOR.BUILD.PATCH`; the BUILD number is the name of the Chromium
// release branch, so e.g. `149.0.7827.54` maps to `refs/branch-heads/7827`. The
// version is read from the `chrome-for-testing-stable-version` anchor in the
// CircleCI pipeline config. Pass `--ref <git-ref>` to override (e.g. to test
// against `refs/heads/main`). Requires outbound network access to
// chromium.googlesource.com.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ALLOWLIST_PATH = path.join(__dirname, '..', 'packages', 'server', 'lib', 'util', 'chrome-switches.json')

// the pinned Chrome version Cypress tests against lives here as a YAML anchor
const PIPELINE_CONFIG_PATH = path.join(__dirname, '..', '.circleci', 'src', 'pipeline', '@pipeline.yml')

// Chromium source files that define command-line switches as
// `const char kFoo[] = "switch-name";`. This list covers the subsystems whose
// switches Cypress passes; extend it if a valid flag is reported as unknown.
const SWITCH_SOURCE_FILES = [
  'content/public/common/content_switches.cc',
  'chrome/common/chrome_switches.cc',
  'components/autofill/core/common/autofill_switches.cc',
  'components/network_session_configurator/common/network_switches.cc',
  'components/safe_browsing/core/common/safebrowsing_switches.cc',
  'components/sync/base/command_line_switches.cc',
  'components/metrics/metrics_switches.cc',
  'ui/base/ui_base_switches.cc',
  'ui/gl/gl_switches.cc',
  'gpu/config/gpu_switches.cc',
  'media/base/media_switches.cc',
  'cc/base/switches.cc',
  'sandbox/policy/switches.cc',
  'third_party/blink/public/common/switches.cc',
]

const BASE_URL = 'https://chromium.googlesource.com/chromium/src/+'

// matches: const char kFoo[] = "switch-name";  (and constexpr/inline variants)
const SWITCH_LITERAL_RE = /k\w+\[\]\s*=\s*"([a-z0-9][a-z0-9-]*)"/g

const parseArgs = (argv) => {
  const args = { write: false, check: false, ref: null }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--write') args.write = true
    else if (arg === '--check') args.check = true
    else if (arg === '--ref') args.ref = argv[++i]
  }

  if (!args.write) args.check = true

  return args
}

// reads the Chrome version Cypress tests against and maps it to the Chromium
// release-branch ref. Chrome `MAJOR.MINOR.BUILD.PATCH` -> `refs/branch-heads/BUILD`.
const resolvePinnedChrome = () => {
  const config = fs.readFileSync(PIPELINE_CONFIG_PATH, 'utf8')
  const match = config.match(/chrome-for-testing-stable-version:\s*&\S+\s*["'](\d+\.\d+\.(\d+)\.\d+)["']/)

  if (!match) {
    throw new Error(`could not find chrome-for-testing-stable-version in ${PIPELINE_CONFIG_PATH}`)
  }

  const [, version, build] = match

  return { version, ref: `refs/branch-heads/${build}` }
}

const fetchFile = async (ref, file) => {
  const url = `${BASE_URL}/${ref}/${file}?format=TEXT`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`failed to fetch ${file} @ ${ref}: HTTP ${res.status}`)
  }

  // googlesource returns the file base64-encoded when ?format=TEXT
  const base64 = await res.text()

  return Buffer.from(base64, 'base64').toString('utf8')
}

const extractSwitches = (source) => {
  const found = new Set()
  let match

  while ((match = SWITCH_LITERAL_RE.exec(source)) !== null) {
    found.add(match[1])
  }

  return found
}

const collectSwitches = async (ref) => {
  const all = new Set()

  for (const file of SWITCH_SOURCE_FILES) {
    process.stdout.write(`fetching ${file} ... `)
    try {
      const source = await fetchFile(ref, file)
      const switches = extractSwitches(source)

      console.log(`${switches.size} switches`)
      for (const s of switches) all.add(s)
    } catch (err) {
      console.log(`WARN: ${err.message}`)
    }
  }

  return [...all].sort()
}

const readCommitted = () => JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'))

const main = async () => {
  const args = parseArgs(process.argv.slice(2))
  // default to the Chrome build under test; allow --ref to override
  const pinned = args.ref ? { version: null, ref: args.ref } : resolvePinnedChrome()

  console.log(`using ref ${pinned.ref}${pinned.version ? ` (Chrome ${pinned.version})` : ''}`)

  const switches = await collectSwitches(pinned.ref)

  if (switches.length === 0) {
    console.error('error: extracted 0 switches — refusing to continue (network or ref problem?)')
    process.exit(1)
  }

  console.log(`\ncollected ${switches.length} unique switches @ ${pinned.ref}`)

  if (args.write) {
    const committed = readCommitted()

    committed.chromeVersion = pinned.version
    committed.ref = pinned.ref
    committed.generatedAt = new Date().toISOString()
    committed.switches = switches
    delete committed._seedNote
    fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(committed, null, 2)}\n`)
    console.log(`wrote ${ALLOWLIST_PATH}`)

    return
  }

  // --check: fail if the committed allowlist drifts from a fresh fetch
  const committed = new Set(readCommitted().switches)
  const fresh = new Set(switches)
  const removed = [...committed].filter((s) => !fresh.has(s))
  const added = [...fresh].filter((s) => !committed.has(s))

  if (removed.length || added.length) {
    console.error('\nallowlist is stale. Re-run with --write to update.')
    if (removed.length) console.error(`  no longer in Chromium: ${removed.join(', ')}`)

    if (added.length) console.error(`  new in Chromium (${added.length}): ${added.slice(0, 10).join(', ')}${added.length > 10 ? ', ...' : ''}`)

    process.exit(1)
  }

  console.log('allowlist is up to date.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
