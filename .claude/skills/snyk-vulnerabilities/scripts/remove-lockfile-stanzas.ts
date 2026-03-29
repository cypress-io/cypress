/**
 * Remove lockfile stanzas by package name + version.
 * Reads removal instructions from stdin (JSON) or CLI arguments.
 *
 * Usage (stdin JSON):
 *   echo '[{"lockfile":"yarn.lock","package":"qs","version":"6.13.0"}]' | \
 *     ts-node remove-lockfile-stanzas.ts
 *
 * Usage (CLI args, repeatable):
 *   ts-node remove-lockfile-stanzas.ts \
 *     --lockfile yarn.lock --package qs --version 6.13.0 \
 *     --lockfile app/yarn.lock --package qs --version 6.13.0
 *
 * Usage (file):
 *   ts-node remove-lockfile-stanzas.ts --input removals.json
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { removeLockfileStanzas } from './lockfile-utils'

type Removal = {
  lockfile: string
  package: string
  version: string
}

function parseArgs(): {
  removals: Removal[]
  inputFile?: string
  help: boolean
} {
  const argv = process.argv.slice(2)
  const removals: Removal[] = []
  let inputFile: string | undefined
  let help = false

  let currentLockfile = ''
  let currentPackage = ''
  let currentVersion = ''

  function flush() {
    if (currentLockfile && currentPackage && currentVersion) {
      removals.push({
        lockfile: currentLockfile,
        package: currentPackage,
        version: currentVersion,
      })
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

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    if (process.stdin.isTTY) {
      resolve('')
      return
    }
    process.stdin.on('data', (chunk) => chunks.push(chunk))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString()))
  })
}

async function main(): Promise<void> {
  const args = parseArgs()

  if (args.help) {
    console.log(`Usage: ts-node remove-lockfile-stanzas.ts [options]

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

  let removals: Removal[] = args.removals

  // Read from file if specified
  if (args.inputFile) {
    const raw = readFileSync(args.inputFile, 'utf8')
    removals = removals.concat(JSON.parse(raw))
  }

  // Read from stdin if no CLI removals and no input file
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

  // Group by lockfile
  const byLockfile = new Map<string, { packageName: string; version: string }[]>()
  const repoRoot = process.cwd()

  for (const r of removals) {
    const fullPath = r.lockfile.startsWith('/')
      ? r.lockfile
      : join(repoRoot, r.lockfile)
    if (!byLockfile.has(fullPath)) byLockfile.set(fullPath, [])
    byLockfile.get(fullPath)!.push({
      packageName: r.package,
      version: r.version,
    })
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
      const targetDesc = targets
        .map((t) => `${t.packageName}@${t.version}`)
        .join(', ')
      console.log(
        `${relativePath}: no matching stanzas found for ${targetDesc}`
      )
    }
  }

  console.log(`\nTotal: ${totalRemoved} stanza(s) removed from ${byLockfile.size} lockfile(s)`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
