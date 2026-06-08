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
import { parseArgs as nodeParseArgs } from 'node:util'
import pRetry, { AbortError } from 'p-retry'
import { PIPELINE_CONFIG_PATH, branchRefForVersion, readPinnedChromeVersions } from './github-actions/chrome-versions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ALLOWLIST_PATH = path.join(__dirname, '..', 'packages', 'server', 'lib', 'util', 'chrome-switches.json')

// Chromium subsystems that define command-line switches, covering those whose
// switches Cypress passes; extend it if a valid flag is reported as unknown.
//
// Each subsystem is a list of *candidate* source paths because Chromium is
// migrating switch literals from `.cc` files into inline headers (`.h`), and the
// holding file can differ by milestone. We union the switches from every
// candidate present at the ref (a 404 or declaration-only candidate is fine if a
// sibling defines the literals); zero switches from *all* candidates is fatal —
// see fetchSwitchSet.
const SWITCH_SOURCE_FILES = [
  // base/ defines its switches inline in the header.
  ['base/base_switches.h', 'base/base_switches.cc'],
  ['content/public/common/content_switches.cc'],
  ['components/input/switches.cc'],
  ['chrome/common/chrome_switches.cc'],
  ['components/password_manager/core/browser/password_manager_switches.cc'],
  ['components/autofill/core/common/autofill_switches.cc'],
  ['components/network_session_configurator/common/network_switches.cc'],
  ['services/network/public/cpp/network_switches.cc'],
  ['components/safe_browsing/core/common/safebrowsing_switches.cc'],
  ['components/sync/base/command_line_switches.h', 'components/sync/base/command_line_switches.cc'],
  ['components/metrics/metrics_switches.h', 'components/metrics/metrics_switches.cc'],
  ['components/variations/variations_switches.cc'],
  ['components/embedder_support/switches.cc'],
  ['components/os_crypt/common/os_crypt_switches.h', 'components/os_crypt/sync/os_crypt_switches.cc'],
  ['ui/base/ui_base_switches.h', 'ui/base/ui_base_switches.cc'],
  ['ui/gl/gl_switches.cc'],
  ['gpu/config/gpu_switches.cc'],
  ['media/base/media_switches.cc'],
  ['cc/base/switches.cc'],
  ['sandbox/policy/switches.cc'],
  ['third_party/blink/common/switches.cc', 'third_party/blink/public/common/switches.cc'],
]

const BASE_URL = 'https://chromium.googlesource.com/chromium/src/+'

// matches a switch definition `const char kFoo[] = "switch-name";` (and
// constexpr/inline variants; the literal may wrap to the next line). Capture
// group 1 is the switch name. Not global — applied per declaration window.
const SWITCH_LITERAL_RE = /k\w+\[\]\s*=\s*"([a-z0-9][a-z0-9-]*)"/
// cheap pre-filter to find the lines that start a switch definition
const SWITCH_DECL_RE = /\bk\w+\[\]\s*=/

const FETCH_TIMEOUT_MS = 30_000
const MAX_FETCH_ATTEMPTS = 4
// a single Chromium switch file (e.g. content_switches.cc) defines well over a
// hundred switches; a healthy intersection across all sources is in the
// hundreds. Anything below this almost certainly means extraction broke.
const MIN_EXPECTED_SWITCHES = 50

// strict mode throws on unknown flags and on `--ref` with no value
const parseArgs = (argv) => {
  const { values } = nodeParseArgs({
    args: argv,
    options: {
      write: { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
      ref: { type: 'string' },
    },
  })

  // default to --check when --write isn't given
  return { ...values, check: values.check || !values.write, ref: values.ref ?? null }
}

// Cypress runs the test suite against both Chrome stable and Chrome beta (the
// `chrome` and `chrome:beta` jobs launch different milestones), so a flag must
// be valid in *every* tested milestone. Resolve each to its Chromium branch.
const resolveTestedChromes = () => {
  let versions

  try {
    versions = readPinnedChromeVersions()
  } catch (err) {
    throw new Error(`could not read pinned Chrome versions from ${PIPELINE_CONFIG_PATH}: ${err.message}`)
  }

  const chromes = [
    { channel: 'stable', version: versions.stable, ref: branchRefForVersion(versions.stable) },
    { channel: 'stable-cft', version: versions.stableCft, ref: branchRefForVersion(versions.stableCft) },
    { channel: 'beta', version: versions.beta, ref: branchRefForVersion(versions.beta) },
  ]

  // stable and chrome-for-testing-stable usually share a release branch; dedupe by ref
  const byRef = new Map()

  for (const chrome of chromes) {
    if (!byRef.has(chrome.ref)) byRef.set(chrome.ref, chrome)
  }

  return [...byRef.values()]
}

// fetches a URL with a timeout, retrying transient failures with exponential
// backoff (1s, 2s, 4s). 4xx other than 429 are permanent: an AbortError stops
// the retries and p-retry rejects with the underlying error (status preserved).
const fetchTextWithRetry = (url) => {
  return pRetry(async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

    if (res.ok) return res.text()

    const err = Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429

    throw permanent ? new AbortError(err) : err
  }, {
    retries: MAX_FETCH_ATTEMPTS - 1,
    minTimeout: 1000,
    factor: 2,
    onFailedAttempt: (err) => {
      console.log(`    attempt ${err.attemptNumber}/${MAX_FETCH_ATTEMPTS} failed (${err.message}); ${err.retriesLeft} left`)
    },
  })
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

// extracts each switch literal mapped to the description Chromium documents in
// the `//` comment block directly above its definition. Anchors on the `kFoo[] =`
// declaration line (so it also catches definitions whose string literal wraps to
// the next line) and walks back over contiguous `//` lines for the description
// (empty string when the switch has no comment).
const extractSwitches = (source) => {
  const switches = new Map()
  const lines = source.split('\n')

  for (let i = 0; i < lines.length; i++) {
    if (!SWITCH_DECL_RE.test(lines[i])) continue

    const match = lines.slice(i, i + 3).join(' ').match(SWITCH_LITERAL_RE)

    if (!match) continue

    const comment = []

    for (let j = i - 1; j >= 0 && lines[j].trim().startsWith('//'); j--) {
      comment.unshift(lines[j].trim().replace(/^\/+\s?/, ''))
    }

    switches.set(match[1], comment.join(' ').replace(/\s+/g, ' ').trim())
  }

  return switches
}

// fetches every subsystem for a ref and returns a Map of switch name ->
// description, unioned across all candidate paths present at the ref (the first
// non-empty description for a switch wins). A subsystem that yields zero switches
// from *every* candidate is fatal (rather than a silent WARN): dropping it would
// silently shrink the allowlist and surface later as a confusing
// chromium_flags_spec failure.
const fetchSwitchSet = async (ref) => {
  const all = new Map()
  const emptySubsystems = []

  // keep a switch's existing description unless we don't have one yet
  const merge = (target, source) => {
    for (const [name, desc] of source) {
      if (!target.get(name)) target.set(name, desc)
    }
  }

  for (const candidates of SWITCH_SOURCE_FILES) {
    const subsystem = new Map()

    for (const file of candidates) {
      const source = await fetchFile(ref, file)
      const switches = source ? extractSwitches(source) : null

      // null source = candidate absent (404) at this ref; '-' distinguishes it
      // from a present-but-zero file, both of which fall back to siblings.
      console.log(`    ${file}: ${switches ? switches.size : '-'}`)

      if (switches) merge(subsystem, switches)
    }

    if (subsystem.size === 0) emptySubsystems.push(candidates.join(' | '))

    merge(all, subsystem)
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
  // stable but removed in beta would silently no-op there), so intersect by name.
  // descriptions are collected across milestones (first non-empty wins).
  let intersection = null
  const descriptions = new Map()

  for (const chrome of chromes) {
    console.log(`\nfetching switches @ ${chrome.ref}:`)
    const set = await fetchSwitchSet(chrome.ref)

    console.log(`  total @ ${chrome.ref}: ${set.size} switches`)

    for (const [name, desc] of set) {
      if (desc && !descriptions.get(name)) descriptions.set(name, desc)
    }

    const names = new Set(set.keys())

    intersection = intersection ? new Set([...intersection].filter((s) => names.has(s))) : names
  }

  const switches = [...intersection].sort()

  console.log(`\n${switches.length} switches valid across all ${chromes.length} tested version(s)`)

  if (switches.length < MIN_EXPECTED_SWITCHES) {
    throw new Error(`only ${switches.length} switches in the intersection (expected >= ${MIN_EXPECTED_SWITCHES}). Refusing to write a likely-corrupt allowlist; check the per-file counts above.`)
  }

  // sorted { switch-name: description } so each switch is self-documenting and
  // the file stays diffable; description is '' when Chromium ships no comment
  const switchesWithDescriptions = Object.fromEntries(switches.map((name) => [name, descriptions.get(name) ?? '']))

  if (args.write) {
    const committed = readCommitted()

    committed.versions = chromes.map(({ channel, version, ref }) => ({ channel, version, ref }))
    committed.generatedAt = new Date().toISOString()
    committed.switches = switchesWithDescriptions
    delete committed._seedNote
    delete committed.chromeVersion
    delete committed.ref
    fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(committed, null, 2)}\n`)
    console.log(`wrote ${switches.length} switches to ${ALLOWLIST_PATH}`)

    return
  }

  // --check: fail if the committed allowlist drifts from a fresh fetch. We compare
  // the switch *names* (keys); descriptions are docs and refresh on --write, so a
  // reworded upstream comment doesn't churn CI.
  const committed = new Set(Object.keys(readCommitted().switches))
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
