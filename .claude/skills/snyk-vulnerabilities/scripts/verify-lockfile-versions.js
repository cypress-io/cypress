/**
 * Verify that packages resolve to expected versions in all workspace lockfiles.
 *
 * Usage:
 *   node verify-lockfile-versions.js <pkg@version> [...]
 *   node verify-lockfile-versions.js --json <pkg@version> [...]
 *   node verify-lockfile-versions.js tar@7.5.11 qs@6.14.2
 *   node verify-lockfile-versions.js tar@7.5.11 --lockfiles yarn.lock,app/yarn.lock
 *
 * Exit code: 0 if all pass, 1 if any failures.
 */
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { findStanzasForPackage, discoverLockfiles } = require('./lockfile-utils')

function parseArgs() {
  const argv = process.argv.slice(2)
  const packages = []
  let lockfilesArg
  let jsonOutput = false
  let help = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--lockfiles' || arg === '-l') lockfilesArg = argv[++i]
    else if (arg === '--json') jsonOutput = true
    else if (arg === '-h' || arg === '--help') help = true
    else if (arg.includes('@') && !arg.startsWith('-')) {
      let atIdx
      if (arg.startsWith('@')) {
        atIdx = arg.indexOf('@', 1)
      } else {
        atIdx = arg.indexOf('@')
      }
      if (atIdx > 0) {
        packages.push({ name: arg.substring(0, atIdx), version: arg.substring(atIdx + 1) })
      }
    }
  }

  return { packages, lockfilesArg, jsonOutput, help }
}

const args = parseArgs()

if (args.help || args.packages.length === 0) {
  console.log(`Usage: node verify-lockfile-versions.js <pkg@version> [...] [options]

Options:
  --lockfiles, -l  Comma-separated lockfile paths (auto-discovers if omitted)
  --json           Output as JSON
  -h, --help       Show help

Examples:
  node verify-lockfile-versions.js tar@7.5.11 qs@6.14.2
  node verify-lockfile-versions.js @modelcontextprotocol/sdk@1.27.1`)
  process.exit(0)
}

const repoRoot = process.cwd()
const lockfiles = args.lockfilesArg
  ? args.lockfilesArg.split(',').map((p) => (p.startsWith('/') ? p : join(repoRoot, p)))
  : discoverLockfiles(repoRoot)

const results = []
let hasFailures = false

for (const pkg of args.packages) {
  for (const lockfile of lockfiles) {
    if (!existsSync(lockfile)) continue

    const content = readFileSync(lockfile, 'utf8')
    const stanzas = findStanzasForPackage(content, pkg.name)
    const relativePath = lockfile.startsWith(repoRoot)
      ? lockfile.substring(repoRoot.length + 1)
      : lockfile

    if (stanzas.length === 0) {
      results.push({
        package: pkg.name,
        expectedVersion: pkg.version,
        lockfile: relativePath,
        status: 'not_found',
        foundVersions: [],
      })
      continue
    }

    const versions = [...new Set(stanzas.map((s) => s.resolvedVersion))]
    const allMatch = versions.every((v) => v === pkg.version)
    const anyBad = versions.some((v) => v !== pkg.version)

    if (anyBad) hasFailures = true

    results.push({
      package: pkg.name,
      expectedVersion: pkg.version,
      lockfile: relativePath,
      status: allMatch ? 'pass' : 'fail',
      foundVersions: versions,
    })
  }
}

if (args.jsonOutput) {
  console.log(JSON.stringify(results, null, 2))
} else {
  const passes = results.filter((r) => r.status === 'pass')
  const fails = results.filter((r) => r.status === 'fail')
  const notFound = results.filter((r) => r.status === 'not_found')

  for (const r of results) {
    const icon = r.status === 'pass' ? 'OK' : r.status === 'fail' ? 'FAIL' : 'SKIP'
    const detail =
      r.status === 'not_found'
        ? '(not in lockfile)'
        : r.status === 'fail'
          ? `expected ${r.expectedVersion}, found ${r.foundVersions.join(', ')}`
          : r.expectedVersion
    console.log(`  [${icon}] ${r.lockfile}: ${r.package} ${detail}`)
  }

  console.log(`\nSummary: ${passes.length} pass, ${fails.length} fail, ${notFound.length} not found`)

  if (fails.length > 0) {
    console.log('\nFAILED — some packages do not resolve to expected versions')
  } else {
    console.log('\nALL PASS')
  }
}

process.exit(hasFailures ? 1 : 0)
