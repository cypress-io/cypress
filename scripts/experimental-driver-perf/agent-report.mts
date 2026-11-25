// Breaks down where experimental driver agent calls spend their time, joining the
// driver's round trips (.jsonl) with the server's phases (.agent.jsonl).
//
// node scripts/experimental-driver-perf/agent-report.mts --out <dir>
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

type AgentCall = { perfId: string, ms: number }
type CommandRecord = { spec: string, test: string, name: string, kind: string, ms: number, retries: number, state: string, agentCalls?: AgentCall[] }
type ServerCall = { perfId: string, browser: string, method: string, totalMs: number, phases: Record<string, number>, counts: Record<string, number> }

const { values } = parseArgs({ options: { out: { type: 'string' } } })

if (!values.out) {
  throw new Error('--out is required')
}

const out = path.resolve(values.out)
const readJsonl = <T>(file: string): T[] => fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))

const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const fmt = (ms: number) => Number.isNaN(ms) ? '—' : `${ms.toFixed(1)}ms`

const PHASES = ['frame', 'createWorld', 'readSource', 'install', 'evaluate']

type Joined = { command: CommandRecord, afterVisit: boolean, calls: { driverMs: number, server: ServerCall }[] }

const byBrowser = new Map<string, Joined[]>()

for (const file of fs.readdirSync(out).filter((name) => name.startsWith('experimental-') && name.endsWith('.agent.jsonl'))) {
  const name = file.replace(/\.agent\.jsonl$/, '')
  const browser = name.split('-')[1]
  const server = new Map(readJsonl<ServerCall>(path.join(out, file)).map((call) => [call.perfId, call]))
  const commands = readJsonl<CommandRecord>(path.join(out, `${name}.jsonl`))
  const joined = byBrowser.get(browser) ?? []

  commands.forEach((command, i) => {
    const previous = commands[i - 1]
    const calls = (command.agentCalls ?? []).flatMap((call) => {
      const match = server.get(call.perfId)

      return match ? [{ driverMs: call.ms, server: match }] : []
    })

    joined.push({ command, afterVisit: previous?.test === command.test && previous.name === 'visit', calls })
  })

  byBrowser.set(browser, joined)
}

const lines: string[] = []

for (const [browser, joined] of byBrowser) {
  const calls = joined.flatMap((entry) => entry.calls)
  const installing = calls.filter((call) => call.server.counts.install)
  const warm = calls.filter((call) => !call.server.counts.install)

  lines.push(`## ${browser}`, '')
  lines.push('Each agent call, split by whether it had to install the agent first:', '')
  lines.push(`| Calls | Count | Driver round trip | Server total | Transport (round trip − server) | ${PHASES.join(' | ')} |`)
  lines.push(`| --- | --- | --- | --- | --- | ${PHASES.map(() => '---').join(' | ')} |`)

  for (const [label, group] of [['Installs the agent', installing], ['Agent already installed', warm]] as const) {
    const phase = (key: string) => fmt(mean(group.map((call) => call.server.phases[key] ?? 0)))

    lines.push(`| ${label} | ${group.length} | ${fmt(mean(group.map((call) => call.driverMs)))} | ${fmt(mean(group.map((call) => call.server.totalMs)))} | ${fmt(mean(group.map((call) => call.driverMs - call.server.totalMs)))} | ${PHASES.map(phase).join(' | ')} |`)
  }

  lines.push('')

  const firstQueries = joined.filter((entry) => entry.afterVisit && entry.command.kind === 'query' && entry.command.state === 'passed')
  const breakdown = (entry: Joined) => {
    const install = sum(entry.calls.map((call) => call.server.phases.install ?? 0))
    const otherServer = sum(entry.calls.map((call) => call.server.totalMs)) - install
    const transport = sum(entry.calls.map((call) => call.driverMs - call.server.totalMs))

    return { total: entry.command.ms, install, otherServer, transport, between: entry.command.ms - sum(entry.calls.map((call) => call.driverMs)), calls: entry.calls.length }
  }
  const parts = firstQueries.map(breakdown)
  const avg = (key: keyof ReturnType<typeof breakdown>) => mean(parts.map((part) => part[key]))

  lines.push(`First query after \`cy.visit\` (${firstQueries.length} commands):`, '')
  lines.push('| Command time | Agent install | Other server work | Transport | Between round trips (retry waits, driver) | Round trips |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  lines.push(`| ${fmt(avg('total'))} | ${fmt(avg('install'))} | ${fmt(avg('otherServer'))} | ${fmt(avg('transport'))} | ${fmt(avg('between'))} | ${avg('calls').toFixed(2)} |`)
  lines.push('')

  const installCommands = joined.filter((entry) => entry.calls.some((call) => call.server.counts.install))
  const installsBy = new Map<string, number>()

  for (const entry of installCommands) {
    const key = entry.afterVisit ? `${entry.command.name} after visit` : entry.command.name

    installsBy.set(key, (installsBy.get(key) ?? 0) + 1)
  }

  lines.push(`Agent installs: ${installing.length}, adding ${fmt(sum(installing.map((call) => call.server.phases.install ?? 0)))} in all. Commands that triggered them: ${[...installsBy].sort((a, b) => b[1] - a[1]).map(([key, count]) => `${key} (${count})`).join(', ')}.`, '')
}

process.stdout.write(`${lines.join('\n')}\n`)
