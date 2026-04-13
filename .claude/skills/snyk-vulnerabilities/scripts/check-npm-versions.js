/**
 * Query npm registry for available versions of a package.
 * Replaces ad-hoc: npm view <pkg> versions --json | python3 -c "..."
 *
 * Usage:
 *   node check-npm-versions.js <package> [--major <N>] [--gte <version>] [--last <N>] [--json]
 *
 * Examples:
 *   node check-npm-versions.js tar --major 7
 *   node check-npm-versions.js qs --gte 6.14.0 --last 5
 *   node check-npm-versions.js multer --json
 */
const { execFileSync } = require('child_process')
const { compareVersions } = require('./vuln-utils')

function parseArgs() {
  const argv = process.argv.slice(2)
  let pkg = ''
  let major
  let gte
  let last = '10'
  let jsonOutput = false
  let help = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--major') major = argv[++i]
    else if (arg === '--gte') gte = argv[++i]
    else if (arg === '--last') last = argv[++i]
    else if (arg === '--json') jsonOutput = true
    else if (arg === '-h' || arg === '--help') help = true
    else if (!pkg) pkg = arg
  }

  return { pkg, major, gte, last: parseInt(last, 10), jsonOutput, help }
}

const args = parseArgs()

if (args.help || !args.pkg) {
  console.log(`Usage: node check-npm-versions.js <package> [options]

Options:
  --major <N>    Filter to major version N (e.g., --major 7)
  --gte <ver>    Filter versions >= ver
  --last <N>     Show only last N versions (default: 10)
  --json         Output as JSON array
  -h, --help     Show help`)
  process.exit(0)
}

const raw = execFileSync('npm', ['view', args.pkg, 'versions', '--json'], {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'ignore'],
})
const parsed = JSON.parse(raw)
let versions = Array.isArray(parsed) ? parsed : [parsed]

if (args.major) {
  versions = versions.filter((v) => v.startsWith(`${args.major}.`))
}

if (args.gte) {
  versions = versions.filter((v) => compareVersions(v, args.gte) >= 0)
}

versions = versions.slice(-args.last)

if (args.jsonOutput) {
  console.log(JSON.stringify(versions, null, 2))
} else {
  console.log(`Available versions of ${args.pkg}:`)
  for (const v of versions) {
    console.log(`  ${v}`)
  }
  console.log(`\n${versions.length} version(s) shown`)
}
