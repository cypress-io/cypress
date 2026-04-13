const { readFileSync, accessSync } = require('fs')
const { extractPackageVulnerabilities } = require('./vuln-file')

function parseArgs() {
  const argv = process.argv.slice(2)
  const args = { file: 'snyk.json', help: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-h' || argv[i] === '--help') args.help = true
    else if (argv[i] === '-f' || argv[i] === '--file') args.file = argv[++i] ?? ''
  }
  return args
}

function packageScan(fileData) {
  const jsonData = JSON.parse(fileData)
  const vulnerabilities = extractPackageVulnerabilities(jsonData)
  const ids = Object.keys(vulnerabilities)
  if (ids.length === 0) {
    console.log('No vulnerabilities found.')
    return 0
  }
  for (const id of ids) {
    const v = vulnerabilities[id]
    console.log(`${v.id} (${v.severity}): ${v.title}`)
    for (const p of v.paths ?? []) {
      const pathStr = p.path.length ? p.path.join(' -> ') : '(no path)'
      console.log(`  ${p.projectName}: ${pathStr}`)
    }
  }
  return ids.length
}

const args = parseArgs()

if (args.help) {
  console.log(`
Usage: node vuln-actions.js [--file <file>]
Options:
  --file, -f   Path to Snyk package scan JSON (default: snyk.json)
  --help, -h   Show this help message
`)
  process.exit(0)
}

try {
  accessSync(args.file)
} catch {
  console.error(`File not found: ${args.file}`)
  process.exit(1)
}

const fileData = readFileSync(args.file, 'utf8')
const count = packageScan(fileData)
if (count > 0) {
  process.exit(1)
}
