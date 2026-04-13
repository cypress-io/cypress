/**
 * Parse Snyk JSON output and produce a quick summary.
 * Replaces ad-hoc Python scripts for parsing Snyk results.
 *
 * Usage:
 *   node parse-snyk-summary.js <snyk-json-file>
 *   node parse-snyk-summary.js --json <snyk-json-file>
 *
 * Exit code: 0 if no vulns, 1 if vulns found.
 */
const { readFileSync } = require('fs')

const argv = process.argv.slice(2)
let jsonOutput = false
let file = ''

for (const arg of argv) {
  if (arg === '--json') jsonOutput = true
  else if (arg === '-h' || arg === '--help') {
    console.log('Usage: node parse-snyk-summary.js [--json] <snyk-json-file>')
    process.exit(0)
  } else if (!file) file = arg
}

if (!file) {
  console.error('Error: No file specified')
  process.exit(1)
}

const raw = readFileSync(file, 'utf8')
const data = JSON.parse(raw)

if (Array.isArray(data)) {
  const projects = data.map((r) => ({
    projectName: r.projectName || 'unknown',
    vulnCount: (r.vulnerabilities || []).length,
  }))
  const totalVulns = projects.reduce((sum, p) => sum + p.vulnCount, 0)
  const affected = projects.filter((p) => p.vulnCount > 0)

  if (jsonOutput) {
    console.log(JSON.stringify({ projectCount: data.length, totalVulns, affected }, null, 2))
  } else {
    console.log(`${data.length} projects scanned, ${totalVulns} total vulnerabilities`)
    for (const p of affected) {
      console.log(`  ${p.projectName}: ${p.vulnCount} vulns`)
    }
    if (totalVulns === 0) {
      console.log('ALL CLEAR - no high-severity vulnerabilities found!')
    }
  }

  process.exit(totalVulns > 0 ? 1 : 0)
} else {
  const vulns = (data.vulnerabilities || []).length
  if (jsonOutput) {
    console.log(JSON.stringify({ ok: data.ok, vulnCount: vulns }, null, 2))
  } else {
    console.log(`ok: ${data.ok}`)
    console.log(`vulnerabilities: ${vulns}`)
  }
  process.exit(vulns > 0 ? 1 : 0)
}
