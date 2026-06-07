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
// By default the refs are derived from the Chrome versions Cypress tests
// against, so the allowlist always tracks the Chrome builds under test (and
// re-pins automatically when the browser-version updater bumps them). Cypress
// runs against both Chrome stable and Chrome beta, which can be different
// milestones, so the committed allowlist is the *intersection* of switches
// valid in every tested version — a flag valid only in one would silently
// no-op in the other. Chrome versions are `MAJOR.MINOR.BUILD.PATCH`; the BUILD
// number is the name of the Chromium release branch, so e.g. `149.0.7827.54`
// maps to `refs/branch-heads/7827`. Versions are read from the
// `chrome-for-testing-stable-version` and `chrome-beta-version` anchors in the
// CircleCI pipeline config. Pass `--ref <git-ref>` to override with a single
// ref (e.g. to test against `refs/heads/main`). Requires outbound network
// access to chromium.googlesource.com.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ALLOWLIST_PATH = path.join(__dirname, '..', 'packages', 'server', 'lib', 'util', 'chrome-switches.json')

// the pinned Chrome version Cypress tests against lives here as a YAML anchor
const PIPELINE_CONFIG_PATH = path.join(__dirname, '..', '.circleci', 'src', 'pipeline', '@pipeline.yml')

// Chromium subsystems that define command-line switches, covering those whose
// switches Cypress passes; extend it if a valid flag is reported as unknown.
//
// Each subsystem is a list of *candidate* source paths. Chromium is mid-flight
// migrating switch literals out of a `.cc` (`const char kFoo[] = "x";`) and into
// the header inline (`inline constexpr char kFoo[] = "x";`), so the file that
// holds the literals differs by milestone — e.g. `metrics_switches.cc` in M149
// but `metrics_switches.h` in M150. Because the committed allowlist is the
// intersection across several milestones, a subsystem may live in the `.cc` in
// one tested milestone and the `.h` in another. For each subsystem we take the
// union of switches from every candidate that's present at the ref; a candidate
// that 404s or is declaration-only is fine as long as a sibling still defines
// the literals. A subsystem that yields zero switches from *all* its candidates
// is fatal (the paths truly moved) — see fetchSwitchSet.
const SWITCH_SOURCE_FILES = [
  // base/ defines its switches inline in the header (disable-features,
  // disable-breakpad, disable-dev-shm-usage, noerrdialogs, ...).
  ['base/base_switches.h', 'base/base_switches.cc'],
  ['content/public/common/content_switches.cc'],
  ['chrome/common/chrome_switches.cc'],
  ['components/autofill/core/common/autofill_switches.cc'],
  ['components/network_session_configurator/common/network_switches.cc'],
  ['services/network/public/cpp/network_switches.cc'],
  ['components/safe_browsing/core/common/safebrowsing_switches.cc'],
  ['components/sync/base/command_line_switches.h', 'components/sync/base/command_line_switches.cc'],
  ['components/metrics/metrics_switches.h', 'components/metrics/metrics_switches.cc'],
  ['components/variations/variations_switches.cc'],
  ['components/embedder_support/switches.cc'],
  // os_crypt was restructured (sync/ -> common/) and migrated to a header.
  ['components/os_crypt/common/os_crypt_switches.h', 'components/os_crypt/sync/os_crypt_switches.cc'],
  ['ui/base/ui_base_switches.h', 'ui/base/ui_base_switches.cc'],
  ['ui/gl/gl_switches.cc'],
  ['gpu/config/gpu_switches.cc'],
  ['media/base/media_switches.cc'],
  ['cc/base/switches.cc'],
  ['sandbox/policy/switches.cc'],
  // blink declares switches in public/common/switches.h but defines the
  // literals in the non-public impl dir; older milestones used public/common.
  ['third_party/blink/common/switches.cc', 'third_party/blink/public/common/switches.cc'],
]

const BASE_URL = 'https://chromium.googlesource.com/chromium/src/+'

// matches: const char kFoo[] = "switch-name";  (and constexpr/inline variants)
const SWITCH_LITERAL_RE = /k\w+\[\]\s*=\s*"([a-z0-9][a-z0-9-]*)"/g

const FETCH_TIMEOUT_MS = 30_000
const MAX_FETCH_ATTEMPTS = 4
// a single Chromium switch file (e.g. content_switches.cc) defines well over a
// hundred switches; a healthy intersection across all sources is in the
// hundreds. Anything below this almost certainly means extraction broke.
const MIN_EXPECTED_SWITCHES = 50

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const parseArgs = (argv) => {
  const args = { write: false, check: false, ref: null }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--write') {
      args.write = true
    } else if (arg === '--check') {
      args.check = true
    } else if (arg === '--ref') {
      args.ref = argv[++i]
      if (!args.ref || args.ref.startsWith('--')) {
        throw new Error('--ref requires a value, e.g. --ref refs/heads/main')
      }
    } else {
      throw new Error(`unknown argument: ${arg}. Usage: generate-chrome-switches [--write|--check] [--ref <git-ref>]`)
    }
  }

  if (!args.write) args.check = true

  return args
}

// maps a Chrome version to its Chromium release-branch ref.
// Chrome `MAJOR.MINOR.BUILD.PATCH` -> `refs/branch-heads/BUILD`.
const parseVersionAnchor = (config, key) => {
  const match = config.match(new RegExp(`${key}:\\s*&\\S+\\s*["'](\\d+\\.\\d+\\.(\\d+)\\.\\d+)["']`))

  if (!match) {
    throw new Error(`could not find ${key} in ${PIPELINE_CONFIG_PATH}`)
  }

  const [, version, build] = match

  return { version, ref: `refs/branch-heads/${build}` }
}

// Cypress runs the test suite against both Chrome stable and Chrome beta (the
// `chrome` and `chrome:beta` jobs launch different milestones), so a flag must
// be valid in *every* tested milestone. Resolve each to its Chromium branch.
const resolveTestedChromes = () => {
  let config

  try {
    config = fs.readFileSync(PIPELINE_CONFIG_PATH, 'utf8')
  } catch (err) {
    throw new Error(`could not read pinned Chrome versions from ${PIPELINE_CONFIG_PATH}: ${err.message}`)
  }

  const chromes = [
    { channel: 'stable', ...parseVersionAnchor(config, 'chrome-stable-version') },
    { channel: 'stable-cft', ...parseVersionAnchor(config, 'chrome-for-testing-stable-version') },
    { channel: 'beta', ...parseVersionAnchor(config, 'chrome-beta-version') },
  ]

  // stable and chrome-for-testing-stable usually share a release branch; dedupe by ref
  const byRef = new Map()

  for (const chrome of chromes) {
    if (!byRef.has(chrome.ref)) byRef.set(chrome.ref, chrome)
  }

  return [...byRef.values()]
}

// fetches a URL with a timeout and retry/backoff on transient failures.
// 4xx (other than 429) are treated as permanent and fail fast.
const fetchTextWithRetry = async (url) => {
  let lastErr

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

      if (res.ok) return await res.text()

      const permanent = res.status >= 400 && res.status < 500 && res.status !== 429

      lastErr = Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
      if (permanent) break
    } catch (err) {
      lastErr = err
    }

    if (attempt < MAX_FETCH_ATTEMPTS) {
      const backoff = 2 ** (attempt - 1) * 1000

      console.log(`    attempt ${attempt}/${MAX_FETCH_ATTEMPTS} failed (${lastErr.message}); retrying in ${backoff}ms`)
      await sleep(backoff)
    }
  }

  throw lastErr
}

// fetches a source file, returning its decoded text, or null if it 404s — a
// candidate path may simply not exist in a given milestone (e.g. a subsystem
// whose literals migrated between a .cc and a header). Any other failure is
// fatal, since it would otherwise silently shrink the allowlist.
const fetchFile = async (ref, file) => {
  const url = `${BASE_URL}/${ref}/${file}?format=TEXT`
  let base64

  try {
    base64 = await fetchTextWithRetry(url)
  } catch (err) {
    if (err.status === 404) return null

    throw new Error(`failed to fetch ${file} @ ${ref} (${url}): ${err.message}`)
  }

  // googlesource returns the file base64-encoded when ?format=TEXT
  const content = Buffer.from(base64, 'base64').toString('utf8')

  if (!content.trim()) {
    throw new Error(`empty or undecodable response for ${file} @ ${ref} (${url})`)
  }

  return content
}

const extractSwitches = (source) => {
  const found = new Set()

  // reset lastIndex defensively since the regex is reused across files
  SWITCH_LITERAL_RE.lastIndex = 0

  let match

  while ((match = SWITCH_LITERAL_RE.exec(source)) !== null) {
    found.add(match[1])
  }

  return found
}

// fetches every subsystem for a ref and returns the union of switches it
// defines. For each subsystem we union switches across all candidate paths
// present at the ref. A subsystem that yields zero switches from *every*
// candidate is fatal (rather than a silent WARN): dropping it would silently
// shrink the allowlist and surface later as a confusing chromium_flags_spec
// failure.
const fetchSwitchSet = async (ref) => {
  const all = new Set()
  const emptySubsystems = []

  for (const candidates of SWITCH_SOURCE_FILES) {
    const subsystem = new Set()

    for (const file of candidates) {
      const source = await fetchFile(ref, file)
      const switches = source ? extractSwitches(source) : null

      // null source = candidate absent (404) at this ref; '-' distinguishes it
      // from a present-but-zero file, both of which fall back to siblings.
      console.log(`    ${file}: ${switches ? switches.size : '-'}`)

      if (switches) for (const s of switches) subsystem.add(s)
    }

    if (subsystem.size === 0) emptySubsystems.push(candidates.join(' | '))

    for (const s of subsystem) all.add(s)
  }

  if (emptySubsystems.length) {
    const hint = 'The path(s) may have moved in this Chromium version, or SWITCH_LITERAL_RE no longer matches. Update SWITCH_SOURCE_FILES / the extraction regex in scripts/generate-chrome-switches.mjs.'

    throw new Error(`extracted 0 switches from ${emptySubsystems.length} subsystem(s) @ ${ref}: ${emptySubsystems.join(', ')}. ${hint}`)
  }

  return all
}

const readCommitted = () => {
  try {
    return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'))
  } catch (err) {
    throw new Error(`could not read/parse committed allowlist ${ALLOWLIST_PATH}: ${err.message}`)
  }
}

const main = async () => {
  const args = parseArgs(process.argv.slice(2))
  // default to the Chrome versions under test; allow --ref to override with a single ref
  const chromes = args.ref
    ? [{ channel: 'custom', version: null, ref: args.ref }]
    : resolveTestedChromes()

  console.log(`[generate-chrome-switches] mode=${args.write ? 'write' : 'check'}, validating against ${chromes.length} Chrome version(s):`)
  for (const c of chromes) console.log(`  ${c.channel}: ${c.version ?? '(custom ref)'} -> ${c.ref}`)

  // a flag must be recognized by *every* tested milestone (a switch present in
  // stable but removed in beta would silently no-op there), so intersect the sets
  let intersection = null

  for (const chrome of chromes) {
    console.log(`\nfetching switches @ ${chrome.ref}:`)
    const set = await fetchSwitchSet(chrome.ref)

    console.log(`  total @ ${chrome.ref}: ${set.size} switches`)
    intersection = intersection ? new Set([...intersection].filter((s) => set.has(s))) : set
  }

  const switches = [...intersection].sort()

  console.log(`\n${switches.length} switches valid across all ${chromes.length} tested version(s)`)

  if (switches.length < MIN_EXPECTED_SWITCHES) {
    throw new Error(`only ${switches.length} switches in the intersection (expected >= ${MIN_EXPECTED_SWITCHES}). Refusing to write a likely-corrupt allowlist; check the per-file counts above.`)
  }

  if (args.write) {
    const committed = readCommitted()

    committed.versions = chromes.map(({ channel, version, ref }) => ({ channel, version, ref }))
    committed.generatedAt = new Date().toISOString()
    committed.switches = switches
    delete committed._seedNote
    delete committed.chromeVersion
    delete committed.ref
    fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(committed, null, 2)}\n`)
    console.log(`wrote ${switches.length} switches to ${ALLOWLIST_PATH}`)

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
  // surface a clear, greppable failure line for CI logs, then the full stack
  console.error(`\n[generate-chrome-switches] FAILED: ${err.message}`)
  console.error(err.stack)
  process.exit(1)
})
