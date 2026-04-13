/**
 * Remove lockfile stanzas by package name + version.
 * Reads removal instructions from stdin (JSON) or CLI arguments.
 *
 * Usage (stdin JSON):
 *   echo '[{"lockfile":"yarn.lock","package":"qs","version":"6.13.0"}]' | \
 *     node remove-lockfile-stanzas.js
 *
 * Usage (CLI args, repeatable):
 *   node remove-lockfile-stanzas.js \
 *     --lockfile yarn.lock --package qs --version 6.13.0 \
 *     --lockfile app/yarn.lock --package qs --version 6.13.0
 *
 * Usage (file):
 *   node remove-lockfile-stanzas.js --input removals.json
 */
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { removeLockfileStanzas } = require('./lockfile-utils')

function parseArgs() {
  const argv = process.argv.slice(2)
  const removals = []
  let inputFile
  let help = false

  let currentLockfile = ''
  let currentPackage = ''
  let currentVersion = ''

  function flush() {
    if (currentLockfile && currentPackage && currentVersion) {
      removals.push({ lockfile: currentLockfile, package: currentPackage, version: currentVersion })
    }
    currentPackage = ''
    currentVersion = ''
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--lockfile' || arg === '-l') {
      flush()
      currentLockfile = argv[++i]
    } else if (arg === '--package' || arg === '-p') {
      currentPackage = argv[++i]
    } else if (arg === '--version' || arg === '-v') {
      currentVersion = argv[++i]
    } else if (arg === '--input' || arg === '-i') {
      inputFile = argv[++i]
    } else if (arg === '-h' || arg === '--help') {
      help = true
    }
  }
  flush()

  return { removals, inputFile, help }
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = []
    if (process.stdin.isTTY) {
      resolve('')
      return
    }
    process.stdin.on('data', (chunk) => chunks.push(chunk))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString()))
  })
}

async function main() {
  const args = parseArgs()

  if (args.help) {
    console.log(`Usage: node remove-lockfile-stanzas.js [options]

Reads removal instructions from stdin JSON, --input file, or CLI args.

JSON format: [{"lockfile":"yarn.lock","package":"qs","version":"6.13.0"}, ...]

CLI options (repeatable per lockfile):
  --lockfile, -l  Lockfile path
  --package, -p   Package name
  --version, -v   Resolved version to remove
  --input, -i     JSON file with removals
  -h, --help      Show help`)
    process.exit(0)
  }

  let removals = args.removals

  if (args.inputFile) {
    const raw = readFileSync(args.inputFile, 'utf8')
    removals = removals.concat(JSON.parse(raw))
  }

  if (removals.length === 0) {
    const stdin = await readStdin()
    if (stdin.trim()) {
      removals = JSON.parse(stdin.trim())
    }
  }

  if (removals.length === 0) {
    console.error('Error: No removals specified. Use --help for usage.')
    process.exit(1)
  }

  const byLockfile = new Map()
  const repoRoot = process.cwd()

  for (const r of removals) {
    const fullPath = r.lockfile.startsWith('/') ? r.lockfile : join(repoRoot, r.lockfile)
    if (!byLockfile.has(fullPath)) byLockfile.set(fullPath, [])
    byLockfile.get(fullPath).push({ packageName: r.package, version: r.version })
  }

  let totalRemoved = 0

  for (const [lockfile, targets] of byLockfile) {
    const relativePath = lockfile.startsWith(repoRoot)
      ? lockfile.substring(repoRoot.length + 1)
      : lockfile

    if (!existsSync(lockfile)) {
      console.log(`SKIP: ${relativePath} (file not found)`)
      continue
    }

    const result = removeLockfileStanzas(lockfile, targets)
    totalRemoved += result.removed.length

    if (result.removed.length > 0) {
      console.log(`${relativePath}: removed ${result.removed.length} stanza(s)`)
      for (const key of result.removed) {
        console.log(`  - ${key.substring(0, 80)}${key.length > 80 ? '...' : ''}`)
      }
    } else {
      const targetDesc = targets.map((t) => `${t.packageName}@${t.version}`).join(', ')
      console.log(`${relativePath}: no matching stanzas found for ${targetDesc}`)
    }
  }

  console.log(`\nTotal: ${totalRemoved} stanza(s) removed from ${byLockfile.size} lockfile(s)`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
