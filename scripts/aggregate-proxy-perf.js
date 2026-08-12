/* eslint-disable no-console */

// Aggregates the `proxy-perf.jsonl` records emitted by
// `packages/server/test/performance/proxy_performance_spec.js` into a single
// markdown comparison table. Each benchmark job contributes one row; re-running
// the pipeline contributes additional trials, which are reduced to a median.
//
// Usage:
//   node scripts/aggregate-proxy-perf.js <path-to-jsonl> [...]
//   node scripts/aggregate-proxy-perf.js --build=3883810 [--build=...]
//
// `--build` reads a CircleCI job's stored artifacts through the unauthenticated
// v1.1 API, so no token is needed for a public project.

const fs = require('fs')
const https = require('https')

const PROJECT = process.env.PROXY_PERF_PROJECT || 'gh/cypress-io/cypress'
const ARTIFACT_NAME = 'proxy-perf.jsonl'

const get = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // the artifact CDN redirects, and v1.1 may too
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()

        return get(res.headers.location).then(resolve, reject)
      }

      if (res.statusCode !== 200) {
        res.resume()

        return reject(new Error(`GET ${url} responded ${res.statusCode}`))
      }

      let body = ''

      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => resolve(body))
    }).on('error', reject)
  })
}

const fetchBuildRecords = async (build) => {
  const artifacts = JSON.parse(await get(`https://circleci.com/api/v1.1/project/${PROJECT}/${build}/artifacts`))
  const matching = artifacts.filter((a) => a.path && a.path.endsWith(ARTIFACT_NAME))

  if (!matching.length) {
    console.error(`build ${build}: no ${ARTIFACT_NAME} artifact found`)

    return []
  }

  const bodies = await Promise.all(matching.map((a) => get(a.url)))

  return bodies.flatMap(parseRecords)
}

const parseRecords = (body) => {
  return body.split('\n')
  .filter((line) => line.trim())
  .map((line) => {
    try {
      return JSON.parse(line)
    } catch {
      console.error(`skipping unparseable line: ${line.slice(0, 120)}`)

      return null
    }
  })
  .filter(Boolean)
}

const median = (values) => {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v)).sort((a, b) => a - b)

  if (!nums.length) return null

  const mid = Math.floor(nums.length / 2)

  return nums.length % 2 ? nums[mid] : Math.round((nums[mid - 1] + nums[mid]) / 2)
}

// `cpu.max` is "<quota> <period>" in microseconds, or "max <period>" when the
// cgroup is unconstrained. quota/period is the vCPU budget the container actually
// got, which is the number `os.cpus()` fails to report.
const vcpuFromCgroup = (cpuMax) => {
  if (!cpuMax) return null

  const [quota, period] = cpuMax.split(/\s+/)

  if (quota === 'max' || !period) return null

  const budget = Number(quota) / Number(period)

  return Number.isFinite(budget) ? Math.round(budget * 100) / 100 : null
}

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return '?'

  return `${(Number(bytes) / 1024 ** 3).toFixed(1)} GB`
}

const buildRow = (label, records) => {
  const env = records.find((r) => r.cgroupCpuMax !== undefined) || records[0] || {}
  const h2 = records.filter((r) => r.test === 'cdp-h2-vs-mitm')
  const noH2 = records.filter((r) => r.test === 'cdp-no-h2-vs-mitm')

  const mitm = median([...h2, ...noH2].map((r) => r.mitmTotal))
  const cdp = median(h2.map((r) => r.cdpTotal))
  const cdpNoH2 = median(noH2.map((r) => r.cdpNoH2Total))

  const cgroupVcpu = vcpuFromCgroup(env.cgroupCpuMax)
  const prefix = ['vm', 'docker'].find((p) => label.startsWith(`${p}-`))

  return {
    cell: label,
    // fall back to cgroup evidence rather than guessing from an unrecognized label
    kind: prefix === 'vm' ? 'VM' : prefix === 'docker' ? 'docker' : (env.cgroupCpuMax ? 'docker' : 'host'),
    class: prefix ? label.slice(prefix.length + 1) : label,
    // without a cpu quota - a VM, or a bare host - the cores it sees really are
    // the cores it may use
    vcpu: String(cgroupVcpu !== null ? cgroupVcpu : (env.coresSeen ?? '?')),
    coresSeen: env.coresSeen === undefined ? '?' : String(env.coresSeen),
    ram: formatBytes(env.cgroupMemoryMax && env.cgroupMemoryMax !== 'max' ? env.cgroupMemoryMax : env.totalMemBytes),
    mitm: mitm === null ? 'no data' : String(mitm),
    cdp: cdp === null ? 'no data' : String(cdp),
    win: mitm !== null && cdp ? `${(mitm / cdp).toFixed(2)}x` : '—',
    cdpNoH2: cdpNoH2 === null ? 'no data' : String(cdpNoH2),
    // absent rather than false when nothing measured, so a missing row is not
    // silently reported as an h2 regression
    h2Kept: h2.length ? (h2.every((r) => r.h2Preserved) ? 'yes' : 'NO') : '—',
    trials: h2.length || noH2.length,
  }
}

const renderTable = (rows) => {
  const headers = ['Cell', 'Kind', 'Class', 'vCPU', 'Cores seen', 'RAM', 'MITM', 'CDP h2', 'CDP win', 'CDP no-h2', 'h2 kept', 'Trials']
  const order = ['cell', 'kind', 'class', 'vcpu', 'coresSeen', 'ram', 'mitm', 'cdp', 'win', 'cdpNoH2', 'h2Kept', 'trials']

  const lines = [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${order.map((k) => String(r[k])).join(' | ')} |`),
  ]

  return lines.join('\n')
}

const main = async () => {
  const args = process.argv.slice(2)

  if (!args.length) {
    console.error('usage: node scripts/aggregate-proxy-perf.js <jsonl-path|--build=N> ...')
    process.exit(1)
  }

  const records = []

  for (const arg of args) {
    if (arg.startsWith('--build=')) {
      records.push(...await fetchBuildRecords(arg.slice('--build='.length)))
    } else {
      records.push(...parseRecords(fs.readFileSync(arg, 'utf8')))
    }
  }

  if (!records.length) {
    console.error('no records found')
    process.exit(1)
  }

  const byLabel = new Map()

  for (const record of records) {
    const label = record.label || 'unlabelled'

    if (!byLabel.has(label)) byLabel.set(label, [])

    byLabel.get(label).push(record)
  }

  // smallest vCPU budget first, so the ladder reads in the direction of the question
  const rows = [...byLabel.entries()]
  .map(([label, group]) => buildRow(label, group))
  .sort((a, b) => (Number(a.vcpu) || 99) - (Number(b.vcpu) || 99) || a.cell.localeCompare(b.cell))

  console.log('Times are milliseconds, median across trials. `CDP win` is MITM / CDP-h2 — above 1.00x means CDP is faster.\n')
  console.log(renderTable(rows))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
