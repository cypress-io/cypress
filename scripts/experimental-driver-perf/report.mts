// Summarizes the output of run.mts as Markdown tables.
//
// node scripts/experimental-driver-perf/report.mts --out <dir>
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

type CommandRecord = { spec: string, test: string, name: string, kind: string, ms: number, retries: number, state: string }
type Run = { browser: string, mode: string, iteration: number, results: any, commands: CommandRecord[] }

const { values } = parseArgs({ options: { out: { type: 'string' } } })

if (!values.out) {
  throw new Error('--out is required')
}

const out = path.resolve(values.out)

const runs: Run[] = fs.readdirSync(out)
.filter((file) => file.endsWith('.json'))
.map((file) => {
  const [mode, browser, iteration] = path.basename(file, '.json').split('-')
  const commandsFile = path.join(out, file.replace(/\.json$/, '.jsonl'))
  const commands = fs.existsSync(commandsFile)
    ? fs.readFileSync(commandsFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
    : []

  return { browser, mode, iteration: Number(iteration), results: JSON.parse(fs.readFileSync(path.join(out, file), 'utf8')), commands }
})

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const fmt = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(1)}ms`
const spread = (xs: number[]) => `${fmt(Math.min(...xs))}–${fmt(Math.max(...xs))}`
const ratio = (experimental: number, legacy: number) => legacy ? `${(experimental / legacy).toFixed(2)}×` : '—'

const testsOf = (run: Run) => {
  return run.results.runs.flatMap((specRun) => {
    return specRun.tests.map((test) => ({ key: `${specRun.spec.relative} :: ${test.title.join(' > ')}`, state: test.state, duration: test.duration }))
  })
}

const commandKey = (record: CommandRecord) => `${record.spec} :: ${record.test}`

const browsers = [...new Set(runs.map((run) => run.browser))]
const lines: string[] = []

for (const browser of browsers) {
  const byMode = (mode: string) => runs.filter((run) => run.browser === browser && run.mode === mode)
  const legacy = byMode('legacy')
  const experimental = byMode('experimental')

  if (!legacy.length || !experimental.length) {
    continue
  }

  // Failing tests stop early or wait out a timeout, so only tests that passed
  // in every run of both modes are compared
  const allRuns = [...legacy, ...experimental]
  const passingEverywhere = new Set(
    testsOf(allRuns[0]).map((test) => test.key).filter((key) => {
      return allRuns.every((run) => testsOf(run).some((test) => test.key === key && test.state === 'passed'))
    }),
  )

  const totalTests = testsOf(allRuns[0]).length

  lines.push(`## ${browser}`, '')
  lines.push(`${legacy.length} legacy and ${experimental.length} experimental runs. ${passingEverywhere.size} of ${totalTests} tests passed in every run and are the only ones in the per-test and per-command numbers.`, '')

  lines.push('| Metric | Legacy mean | Legacy median (range) | Experimental mean | Experimental median (range) | Experimental / legacy (mean) |')
  lines.push('| --- | --- | --- | --- | --- | --- |')

  const row = (label: string, legacyValues: number[], experimentalValues: number[], format = fmt) => {
    lines.push(`| ${label} | ${format(mean(legacyValues))} | ${format(median(legacyValues))} (${spread(legacyValues)}) | ${format(mean(experimentalValues))} | ${format(median(experimentalValues))} (${spread(experimentalValues)}) | ${ratio(mean(experimentalValues), mean(legacyValues))} |`)
  }

  const passed = (run: Run) => testsOf(run).filter((test) => test.state === 'passed').length
  const failed = (run: Run) => testsOf(run).filter((test) => test.state === 'failed').length

  lines.push(`| Tests passed / failed (mean) | ${mean(legacy.map(passed)).toFixed(1)} / ${mean(legacy.map(failed)).toFixed(1)} | | ${mean(experimental.map(passed)).toFixed(1)} / ${mean(experimental.map(failed)).toFixed(1)} | | |`)

  row('Total run time (all tests)', legacy.map((run) => run.results.totalDuration), experimental.map((run) => run.results.totalDuration))

  const comparedTestTime = (run: Run) => testsOf(run).filter((test) => passingEverywhere.has(test.key)).map((test) => test.duration)

  row('Run time, compared tests only', legacy.map((run) => comparedTestTime(run).reduce((a, b) => a + b, 0)), experimental.map((run) => comparedTestTime(run).reduce((a, b) => a + b, 0)))
  row('Time per test (compared tests)', legacy.map((run) => mean(comparedTestTime(run))), experimental.map((run) => mean(comparedTestTime(run))))

  const comparedCommands = (run: Run, kind?: string) => {
    return run.commands.filter((record) => passingEverywhere.has(commandKey(record)) && record.state === 'passed' && (!kind || record.kind === kind))
  }

  for (const kind of [undefined, 'query', 'action', 'assertion', 'other']) {
    const label = kind ?? 'all commands'

    row(`Time per command: ${label}`, legacy.map((run) => mean(comparedCommands(run, kind).map((record) => record.ms))), experimental.map((run) => mean(comparedCommands(run, kind).map((record) => record.ms))))
  }

  const countRow = (label: string, perRun: (run: Run) => number) => {
    lines.push(`| ${label} | ${mean(legacy.map(perRun)).toFixed(1)} | | ${mean(experimental.map(perRun)).toFixed(1)} | | ${ratio(mean(experimental.map(perRun)), mean(legacy.map(perRun)))} |`)
  }

  countRow('Commands per run (compared tests)', (run) => comparedCommands(run).length)
  // A query or action retries together with the assertions chained to it, so retries land on it, not on the assertion
  for (const kind of ['query', 'action', 'other']) {
    countRow(`Retries per run: ${kind} (compared tests)`, (run) => comparedCommands(run, kind).reduce((sum, record) => sum + record.retries, 0))
  }

  lines.push('')

  // Slowest commands by name show which commands carry the overhead
  const names = [...new Set(allRuns.flatMap((run) => comparedCommands(run).map((record) => record.name)))]
  const perName = names.map((name) => {
    const avg = (modeRuns: Run[]) => mean(modeRuns.flatMap((run) => comparedCommands(run).filter((record) => record.name === name).map((record) => record.ms)))
    const count = mean(experimental.map((run) => comparedCommands(run).filter((record) => record.name === name).length))

    return { name, legacyMs: avg(legacy), experimentalMs: avg(experimental), count }
  })
  .filter((entry) => !Number.isNaN(entry.legacyMs) && !Number.isNaN(entry.experimentalMs))
  .sort((a, b) => (b.experimentalMs - b.legacyMs) * b.count - (a.experimentalMs - a.legacyMs) * a.count)
  .slice(0, 10)

  lines.push('Commands adding the most time per run (experimental − legacy, × count):', '')
  lines.push('| Command | Count per run | Legacy mean | Experimental mean | Added per run |')
  lines.push('| --- | --- | --- | --- | --- |')

  for (const entry of perName) {
    lines.push(`| ${entry.name} | ${entry.count.toFixed(0)} | ${fmt(entry.legacyMs)} | ${fmt(entry.experimentalMs)} | ${fmt((entry.experimentalMs - entry.legacyMs) * entry.count)} |`)
  }

  lines.push('')
}

process.stdout.write(`${lines.join('\n')}\n`)
