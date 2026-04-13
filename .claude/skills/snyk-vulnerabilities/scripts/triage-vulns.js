/**
 * Extract triage data from Snyk JSON output.
 * Groups vulnerabilities by package name, extracts fix versions and ranges.
 *
 * Usage:
 *   node triage-vulns.js <snyk-json-file>
 *   node triage-vulns.js --json <snyk-json-file>
 */
const { readFileSync } = require('fs')
const { compareVersions } = require('./vuln-utils')

function buildTriageEntries(data) {
  const byPackage = new Map()

  for (const project of data) {
    for (const vuln of project.vulnerabilities ?? []) {
      const key = vuln.packageName
      let entry = byPackage.get(key)
      if (!entry) {
        entry = {
          packageName: vuln.packageName,
          fixVersion: null,
          vulnerableRanges: [],
          snykIds: [],
          installedVersions: [],
          projects: [],
          titles: [],
          severity: vuln.severity,
        }
        byPackage.set(key, entry)
      }

      if (!entry.snykIds.includes(vuln.id)) entry.snykIds.push(vuln.id)
      if (!entry.titles.includes(vuln.title)) entry.titles.push(vuln.title)
      if (!entry.installedVersions.includes(vuln.version)) entry.installedVersions.push(vuln.version)
      if (!entry.projects.includes(project.projectName)) entry.projects.push(project.projectName)

      for (const range of vuln.semver?.vulnerable ?? []) {
        if (!entry.vulnerableRanges.includes(range)) entry.vulnerableRanges.push(range)
      }

      for (const fix of vuln.fixedIn ?? []) {
        if (!entry.fixVersion || compareVersions(fix, entry.fixVersion) > 0) {
          entry.fixVersion = fix
        }
      }

      const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 }
      if ((severityOrder[vuln.severity] ?? 0) > (severityOrder[entry.severity] ?? 0)) {
        entry.severity = vuln.severity
      }
    }
  }

  return Array.from(byPackage.values()).sort((a, b) => a.packageName.localeCompare(b.packageName))
}

const argv = process.argv.slice(2)
let jsonOutput = false
let file = ''

for (const arg of argv) {
  if (arg === '--json') jsonOutput = true
  else if (arg === '-h' || arg === '--help') {
    console.log('Usage: node triage-vulns.js [--json] <snyk-json-file>')
    process.exit(0)
  } else if (!file) file = arg
}

if (!file) {
  console.error('Error: No Snyk JSON file specified')
  process.exit(1)
}

const raw = readFileSync(file, 'utf8')
const data = JSON.parse(raw)

if (!Array.isArray(data)) {
  console.error('Error: Expected JSON array of Snyk project results')
  process.exit(1)
}

const entries = buildTriageEntries(data)

if (entries.length === 0) {
  console.log('No vulnerabilities found.')
  process.exit(0)
}

if (jsonOutput) {
  console.log(JSON.stringify(entries, null, 2))
} else {
  const totalVulns = entries.reduce((s, e) => s + e.snykIds.length, 0)
  console.log(`Triage Results: ${entries.length} package(s), ${totalVulns} vulnerability ID(s)\n`)
  for (const e of entries) {
    console.log(`Package: ${e.packageName}`)
    console.log(`  Fix version: ${e.fixVersion ?? 'UNKNOWN — check npm registry'}`)
    console.log(`  Severity: ${e.severity}`)
    console.log(`  Vulnerable ranges: ${e.vulnerableRanges.join('; ') || 'N/A'}`)
    console.log(`  SNYK IDs: ${e.snykIds.join(', ')}`)
    console.log(`  Titles: ${e.titles.join('; ')}`)
    console.log(`  Installed versions: ${e.installedVersions.join(', ')}`)
    console.log(`  Affected projects: ${e.projects.join(', ')}`)
    console.log()
  }

  const unknown = entries.filter((e) => !e.fixVersion)
  if (unknown.length > 0) {
    console.log('WARNING: The following packages have no fixedIn data from Snyk.')
    console.log('Use check-npm-versions.js to look up available versions:\n')
    for (const e of unknown) {
      console.log(`  node $SCRIPTS/check-npm-versions.js ${e.packageName}`)
    }
  }
}

process.exit(1)
