/**
 * Check whether specific package versions are deprecated on npm.
 *
 * Usage:
 *   node check-npm-deprecation.js <pkg@version> [...]
 *
 * Examples:
 *   node check-npm-deprecation.js tar@7.5.11 qs@6.14.2
 *   node check-npm-deprecation.js @modelcontextprotocol/sdk@1.27.1
 *
 * Exit codes:
 *   0 — no packages are deprecated
 *   1 — one or more packages are deprecated
 *   2 — one or more registry lookups failed (network error, npm error, etc.)
 */
const { execFileSync } = require('child_process')

function parseArgs() {
  const argv = process.argv.slice(2)
  const packages = []
  let help = false

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      help = true
    } else if (arg.includes('@') && !arg.startsWith('-')) {
      const atIdx = arg.startsWith('@') ? arg.indexOf('@', 1) : arg.indexOf('@')
      if (atIdx > 0) {
        packages.push({ name: arg.substring(0, atIdx), version: arg.substring(atIdx + 1) })
      }
    }
  }

  return { packages, help }
}

const args = parseArgs()

if (args.help || args.packages.length === 0) {
  console.log(`Usage: node check-npm-deprecation.js <pkg@version> [...]

Examples:
  node check-npm-deprecation.js tar@7.5.11 qs@6.14.2
  node check-npm-deprecation.js @scope/pkg@1.2.3

Exit codes: 0 = all clear, 1 = deprecated found, 2 = registry lookup failures.`)
  process.exit(0)
}

const deprecated = []
const clean = []
const errors = []

for (const { name, version } of args.packages) {
  const spec = `${name}@${version}`
  let message = ''
  try {
    const raw = execFileSync('npm', ['view', spec, 'deprecated', '--json'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    if (raw) {
      try {
        message = JSON.parse(raw)
      } catch {
        message = raw
      }
    }
  } catch (err) {
    const stderr = (err.stderr || '').toString()
    if (stderr.includes('E404') || stderr.includes('404 Not Found')) {
      // Version doesn't exist on the registry — not deprecated
    } else {
      errors.push({ spec, detail: stderr.trim() || err.message })
      continue
    }
  }

  if (message) {
    deprecated.push({ spec, message })
  } else {
    clean.push(spec)
  }
}

for (const spec of clean) {
  console.log(`  [OK]         ${spec}`)
}
for (const { spec, message } of deprecated) {
  console.log(`  [DEPRECATED] ${spec} — ${message}`)
}
for (const { spec, detail } of errors) {
  console.log(`  [ERROR]      ${spec} — ${detail}`)
}

console.log(`\nSummary: ${clean.length} ok, ${deprecated.length} deprecated, ${errors.length} errors`)

if (errors.length > 0) {
  console.log('\nREGISTRY LOOKUP FAILURES — cannot confirm deprecation status. Fix network/npm issues and retry.')
  process.exit(2)
} else if (deprecated.length > 0) {
  console.log('\nDEPRECATED PACKAGES FOUND — do not proceed. Choose a non-deprecated fix version.')
  process.exit(1)
} else {
  console.log('\nALL CLEAR — no deprecated packages')
}
