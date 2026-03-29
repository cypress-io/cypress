/**
 * Extract triage data from Snyk JSON output.
 * Groups vulnerabilities by package name, extracts fix versions and ranges.
 *
 * Usage:
 *   ts-node triage-vulns.ts <snyk-json-file>
 *   ts-node triage-vulns.ts --json <snyk-json-file>
 */
import { promises as fs } from 'fs'
import { compareVersions } from './vuln-utils'

type SnykVuln = {
  id: string
  title: string
  severity: string
  packageName: string
  version: string
  semver?: { vulnerable?: string[] }
  fixedIn?: string[]
  from?: string[]
}

type SnykProject = {
  vulnerabilities: SnykVuln[]
  projectName: string
}

type TriageEntry = {
  packageName: string
  fixVersion: string | null
  vulnerableRanges: string[]
  snykIds: string[]
  installedVersions: string[]
  projects: string[]
  titles: string[]
  severity: string
}

function buildTriageEntries(data: SnykProject[]): TriageEntry[] {
  const byPackage = new Map<string, TriageEntry>()

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

      if (!entry.snykIds.includes(vuln.id)) {
        entry.snykIds.push(vuln.id)
      }
      if (!entry.titles.includes(vuln.title)) {
        entry.titles.push(vuln.title)
      }
      if (!entry.installedVersions.includes(vuln.version)) {
        entry.installedVersions.push(vuln.version)
      }
      if (!entry.projects.includes(project.projectName)) {
        entry.projects.push(project.projectName)
      }

      // Collect vulnerable ranges
      for (const range of vuln.semver?.vulnerable ?? []) {
        if (!entry.vulnerableRanges.includes(range)) {
          entry.vulnerableRanges.push(range)
        }
      }

      // Collect fix versions (use highest)
      for (const fix of vuln.fixedIn ?? []) {
        if (
          !entry.fixVersion ||
          compareVersions(fix, entry.fixVersion) > 0
        ) {
          entry.fixVersion = fix
        }
      }

      // Use higher severity
      const severityOrder: Record<string, number> = {
        low: 0,
        medium: 1,
        high: 2,
        critical: 3,
      }
      if (
        (severityOrder[vuln.severity] ?? 0) >
        (severityOrder[entry.severity] ?? 0)
      ) {
        entry.severity = vuln.severity
      }
    }
  }

  return Array.from(byPackage.values()).sort((a, b) =>
    a.packageName.localeCompare(b.packageName)
  )
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  let jsonOutput = false
  let file = ''

  for (const arg of argv) {
    if (arg === '--json') jsonOutput = true
    else if (arg === '-h' || arg === '--help') {
      console.log(
        'Usage: ts-node triage-vulns.ts [--json] <snyk-json-file>'
      )
      process.exit(0)
    } else if (!file) file = arg
  }

  if (!file) {
    console.error('Error: No Snyk JSON file specified')
    process.exit(1)
  }

  const raw = await fs.readFile(file, 'utf8')
  const data: SnykProject[] = JSON.parse(raw)

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
    console.log(
      `Triage Results: ${entries.length} package(s), ${totalVulns} vulnerability ID(s)\n`
    )
    for (const e of entries) {
      console.log(`Package: ${e.packageName}`)
      console.log(
        `  Fix version: ${e.fixVersion ?? 'UNKNOWN — check npm registry'}`
      )
      console.log(`  Severity: ${e.severity}`)
      console.log(`  Vulnerable ranges: ${e.vulnerableRanges.join('; ') || 'N/A'}`)
      console.log(`  SNYK IDs: ${e.snykIds.join(', ')}`)
      console.log(`  Titles: ${e.titles.join('; ')}`)
      console.log(`  Installed versions: ${e.installedVersions.join(', ')}`)
      console.log(`  Affected projects: ${e.projects.join(', ')}`)
      console.log()
    }

    // List packages with unknown fix versions
    const unknown = entries.filter((e) => !e.fixVersion)
    if (unknown.length > 0) {
      console.log('WARNING: The following packages have no fixedIn data from Snyk.')
      console.log(
        'Use check-npm-versions.ts to look up available versions:\n'
      )
      for (const e of unknown) {
        console.log(
          `  npx ts-node check-npm-versions.ts ${e.packageName}`
        )
      }
    }
  }

  process.exit(1) // exit 1 = vulns found
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
