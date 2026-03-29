/**
 * Find all lockfile stanzas for a given package in one or more yarn.lock files.
 * Designed for subagents to use instead of manually grepping lockfiles.
 *
 * Usage:
 *   ts-node find-lockfile-stanzas.ts --package <name> [--version <ver>] [--lockfiles <path1,path2,...>]
 *
 * If --lockfiles is omitted, discovers all workspace lockfiles automatically.
 *
 * Examples:
 *   ts-node find-lockfile-stanzas.ts --package qs
 *   ts-node find-lockfile-stanzas.ts --package qs --version 6.13.0
 *   ts-node find-lockfile-stanzas.ts --package tar --lockfiles yarn.lock,app/yarn.lock
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { findStanzasForPackage, discoverLockfiles } from './lockfile-utils'

function parseArgs() {
  const argv = process.argv.slice(2)
  let packageName = ''
  let version: string | undefined
  let lockfilesArg: string | undefined
  let jsonOutput = false
  let help = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--package' || arg === '-p') packageName = argv[++i]
    else if (arg === '--version' || arg === '-v') version = argv[++i]
    else if (arg === '--lockfiles' || arg === '-l') lockfilesArg = argv[++i]
    else if (arg === '--json') jsonOutput = true
    else if (arg === '-h' || arg === '--help') help = true
  }

  return { packageName, version, lockfilesArg, jsonOutput, help }
}

function main() {
  const args = parseArgs()

  if (args.help || !args.packageName) {
    console.log(`Usage: ts-node find-lockfile-stanzas.ts --package <name> [options]

Options:
  --package, -p  Package name to search for (required)
  --version, -v  Filter to stanzas resolving this version
  --lockfiles, -l  Comma-separated lockfile paths (auto-discovers if omitted)
  --json         Output as JSON
  -h, --help     Show help`)
    process.exit(0)
  }

  const repoRoot = process.cwd()
  const lockfiles = args.lockfilesArg
    ? args.lockfilesArg.split(',').map((p) => (p.startsWith('/') ? p : join(repoRoot, p)))
    : discoverLockfiles(repoRoot)

  type Result = {
    lockfile: string
    relativePath: string
    stanzaKey: string
    resolvedVersion: string
    startLine: number
    endLine: number
  }

  const results: Result[] = []

  for (const lockfile of lockfiles) {
    if (!existsSync(lockfile)) continue
    const content = readFileSync(lockfile, 'utf8')
    const stanzas = findStanzasForPackage(content, args.packageName)

    for (const s of stanzas) {
      if (args.version && s.resolvedVersion !== args.version) continue

      const relativePath = lockfile.startsWith(repoRoot)
        ? lockfile.substring(repoRoot.length + 1)
        : lockfile

      results.push({
        lockfile,
        relativePath,
        stanzaKey: s.keyLine,
        resolvedVersion: s.resolvedVersion,
        startLine: s.startLine + 1, // 1-indexed for display
        endLine: s.endLine,
      })
    }
  }

  if (args.jsonOutput) {
    console.log(JSON.stringify(results, null, 2))
  } else {
    if (results.length === 0) {
      console.log(
        `No stanzas found for "${args.packageName}"${args.version ? ` @ ${args.version}` : ''}`
      )
      process.exit(0)
    }

    console.log(
      `Found ${results.length} stanza(s) for "${args.packageName}"${args.version ? ` @ ${args.version}` : ''}:\n`
    )
    for (const r of results) {
      console.log(`  Lockfile: ${r.relativePath}`)
      console.log(`  Stanza key: ${r.stanzaKey}`)
      console.log(`  Resolved version: ${r.resolvedVersion}`)
      console.log(`  Lines: ${r.startLine}-${r.endLine}`)
      console.log()
    }
  }
}

main()
