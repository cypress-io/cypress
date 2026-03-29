import { promises as fs } from 'fs'
import { type PackageVulnerabilityProject } from './vuln-utils'
import { extractPackageVulnerabilities } from './vuln-file'

function parseArgs(): { file: string; help: boolean } {
  const argv = process.argv.slice(2)
  const args: Record<string, string | boolean> = {
    file: 'snyk.json',
    help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-h' || argv[i] === '--help') args.help = true
    else if (argv[i] === '-f' || argv[i] === '--file') args.file = argv[++i] ?? ''
  }
  return {
    file: String(args.file),
    help: Boolean(args.help),
  }
}

function packageScan(fileData: string): number {
  const jsonData: PackageVulnerabilityProject[] = JSON.parse(fileData)
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

async function main(): Promise<void> {
  const args = parseArgs()

  if (args.help) {
    console.log(`
Usage: node vuln-actions.ts [--file <file>]
Options:
  --file, -f   Path to Snyk package scan JSON (default: snyk.json)
  --help, -h   Show this help message
`)
    process.exit(0)
  }

  try {
    await fs.access(args.file)
  } catch {
    throw new Error(`File not found: ${args.file}`)
  }

  const fileData = await fs.readFile(args.file, 'utf8')
  const count = packageScan(fileData)
  if (count > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
