import chalk from 'chalk'

import type { TapReporterAgent, TapReporterCommand, TapReporterError, TapReporterSession, TapReporterSpecTest, TapReporterSpecView, TapReporterStats, TapReporterSuite, TapReporterView } from '@packages/cypress-instances'
import { color, countsLine, emptyState, heading, layout, stateBadge, table, titleLine } from './format'
import { aliasSuffix, cleanedSuffix, commandLabel, formatMessage, networkDot, networkSuffix } from './command-row'

// The panel's status badge colors: red for a failed session, orange while one
// is being recreated, the reporter's jade otherwise.
const sessionStatus = (status: string | undefined): string => {
  if (status === undefined) {
    return ''
  }

  if (status === 'failed') {
    return color.fail(status)
  }

  if (status.startsWith('recreat')) {
    return color.aborted(status)
  }

  return color.passMessage(status)
}

const sessionsPanel = (sessions: TapReporterSession[]): string[] => {
  return [
    heading('SESSIONS', sessions.length),
    ...sessions.map((session) => {
      const global = session.global ? `  ${chalk.dim('(global)')}` : ''

      return `  ${session.name}${global}  ${sessionStatus(session.status)}`
    }),
  ]
}

const agentsTable = (agents: TapReporterAgent[]): string[] => {
  const rows = agents.map((agent) => {
    return [
      agent.type ?? '',
      agent.functionName ?? '',
      (agent.aliases ?? []).join(', '),
      agent.callCount ? String(agent.callCount) : '-',
    ]
  })

  return table('SPIES / STUBS', ['TYPE', 'FUNCTION', 'ALIAS(ES)', 'CALLS'], rows, (cells) => {
    return [chalk.bold(cells[0]), cells[1], color.alias(cells[2]), cells[3]]
  })
}

const routesTable = (routes: TapReporterView['routes']): string[] => {
  const rows = routes.map((route) => {
    return [
      route.method ?? '',
      route.url ?? '',
      route.stubbed ? 'yes' : 'no',
      route.alias ? `@${route.alias}` : '',
      route.numResponses ? String(route.numResponses) : '-',
    ]
  })

  return table('ROUTES', ['METHOD', 'MATCHER', 'STUBBED', 'ALIAS', '#'], rows, (cells) => {
    return [
      chalk.bold(cells[0]),
      cells[1],
      cells[2].startsWith('yes') ? color.aborted(cells[2]) : cells[2],
      color.alias(cells[3]),
      cells[4],
    ]
  })
}

interface Section {
  hookId: string | undefined
  rows: TapReporterCommand[]
}

// Consecutive rows sharing a hookId form one section, preserving the true
// chronology of the log rather than re-bucketing it.
const sectionize = (commands: TapReporterCommand[]): Section[] => {
  const sections: Section[] = []

  for (const command of commands) {
    const current = sections[sections.length - 1]

    if (current && current.hookId === command.hookId) {
      current.rows.push(command)
    } else {
      sections.push({ hookId: command.hookId, rows: [command] })
    }
  }

  return sections
}

const isEventRow = (command: TapReporterCommand): boolean => {
  return command.event === true || command.type === 'system'
}

const stateSuffix = (command: TapReporterCommand): string => {
  if (command.state === 'failed') {
    return ` ${color.fail('✖')}`
  }

  if (command.state === 'pending') {
    return ` ${chalk.dim('…')}`
  }

  return ''
}

interface RowParts {
  groupIndent: string
  dot: string
  message: string
  cleaned: string
}

const rowParts = (command: TapReporterCommand): RowParts => {
  return {
    groupIndent: '  '.repeat(command.groupLevel ?? 0),
    dot: networkDot(command.network),
    message: formatMessage(command),
    cleaned: cleanedSuffix(command),
  }
}

// Event logs render the way the reporter shows them: labeled by their display
// name, as an annotation of the surrounding command — but with their own tap id,
// so an xhr or uncaught-exception row is referenceable like any command. A
// failed event (an uncaught exception) takes the failure red, like the reporter.
const renderEventRow = (command: TapReporterCommand, idWidth: number): string => {
  const { groupIndent, dot, message, cleaned } = rowParts(command)
  const failed = command.state === 'failed'
  const labelColor = failed ? color.fail : chalk.dim
  const label = labelColor(`(${command.displayName ?? command.name ?? '?'})`)
  const id = color.fadedId(command.id.padStart(idWidth))
  const text = failed ? color.fail(chalk.italic(message)) : chalk.italic(message)

  return `  ${id}  ${groupIndent}  ${label} ${dot}${text}${aliasSuffix(command, command.network)}${networkSuffix(command.network)}${stateSuffix(command)}${cleaned}`
}

const renderCommandRow = (command: TapReporterCommand, idWidth: number, nameWidth: number): string => {
  const { groupIndent, dot, message, cleaned } = rowParts(command)
  const id = chalk.dim(command.id.padStart(idWidth))
  const name = commandLabel(command).padEnd(nameWidth)
  const styledName = command.state === 'failed' ? color.fail.bold(name) : chalk.bold(name)

  return `  ${id}  ${groupIndent}${styledName}  ${dot}${message}${aliasSuffix(command, command.network)}${networkSuffix(command.network)}${stateSuffix(command)}${cleaned}`
}

const renderRow = (command: TapReporterCommand, idWidth: number, nameWidth: number): string => {
  return isEventRow(command)
    ? renderEventRow(command, idWidth)
    : renderCommandRow(command, idWidth, nameWidth)
}

// The hook id in the title is the qualifier a duplicated row number needs
// (`pin r8 h1:1`), since numbers restart per section.
const renderSection = (section: Section, hookName: string, idWidth: number): string[] => {
  const commandRows = section.rows.filter((command) => !isEventRow(command))
  const nameWidth = Math.max(0, ...commandRows.map((command) => commandLabel(command).length))
  const qualifier = section.hookId ? ` · ${section.hookId}` : ''

  return [
    heading(`${hookName.toUpperCase()}${qualifier}`),
    ...section.rows.map((command) => renderRow(command, idWidth, nameWidth)),
  ]
}

// One hook section on its own, for the surfaces that show a slice of the command
// log rather than a whole attempt (the pinned command). Ids align within the
// rows given, since there is no wider log to line up with.
export const renderCommandSection = (rows: TapReporterCommand[], hookName: string | undefined): string[] => {
  const idWidth = Math.max(2, ...rows.map((command) => command.id.length))

  return renderSection({ hookId: rows[0]?.hookId, rows }, hookName ?? 'commands', idWidth)
}

// The reporter's error panel: name, message, and the code frame with its
// `>`-marked failing line.
const renderError = (error: TapReporterError): string[] => {
  const lines = [`${color.fail('✖')} ${color.fail.bold(error.name ?? 'Error')}`]

  if (error.message) {
    lines.push(...error.message.split('\n').map((line) => `  ${color.errHeaderText(line)}`))
  }

  const { codeFrame } = error

  if (codeFrame?.file) {
    lines.push('', `  ${chalk.dim([codeFrame.file, codeFrame.line, codeFrame.column].filter((part) => part != null).join(':'))}`)
  }

  if (codeFrame?.frame) {
    lines.push(...codeFrame.frame.replace(/\n+$/, '').split('\n').map((line) => {
      return `  ${line.startsWith('>') ? color.fail(line) : color.muted(line)}`
    }))
  }

  return lines
}

export const renderReporterHuman = (view: TapReporterView): string => {
  const { icon, word } = stateBadge[view.test.state]
  const hookNames = new Map(view.hooks.map(({ hookId, hookName }) => [hookId, hookName]))
  const sections = sectionize(view.commands)

  const idWidth = Math.max(2, ...view.commands.map((command) => command.id.length))

  const blocks: string[][] = [
    [titleLine(icon, view.test.fullTitle, word)],
    ...(view.sessions.length ? [sessionsPanel(view.sessions)] : []),
    ...(view.agents.length ? [agentsTable(view.agents)] : []),
    ...(view.routes.length ? [routesTable(view.routes)] : []),
    ...sections.map((section) => renderSection(section, hookNames.get(section.hookId ?? '') ?? 'commands', idWidth)),
  ]

  if (!view.commands.length) {
    blocks.push([emptyState('No commands were logged for this test.')])
  }

  if (view.error) {
    blocks.push(renderError(view.error))
  }

  return layout(blocks)
}

// The reporter header's clock format (packages/reporter/src/lib/util.ts
// formatDuration, inlined — the CLI can't import the reporter bundle).
const formatDuration = (duration: number | undefined): string => {
  if (!duration) {
    return '--'
  }

  if (duration < 1000) {
    return `${duration}ms`
  }

  const seconds = Math.round(duration / 1000)
  const displaySeconds = String(seconds % 60).padStart(2, '0')
  const displayMinutes = String(Math.floor((seconds / 60) % 60)).padStart(2, '0')
  const displayHours = String(Math.floor(seconds / (60 * 60)))

  return displayHours === '0' ? `${displayMinutes}:${displaySeconds}` : `${displayHours}:${displayMinutes}:${displaySeconds}`
}

const statsLine = (stats: TapReporterStats): string => {
  return `${countsLine(stats)}  ${chalk.dim(formatDuration(stats.duration))}`
}

// Sub-second durations keep their ms precision; longer ones read as seconds,
// the way the run-mode spec output reports test times.
const testDuration = (duration: number | undefined): string => {
  if (duration == null) {
    return ''
  }

  return `  ${chalk.dim(duration < 1000 ? `${duration}ms` : `${+(duration / 1000).toFixed(1)}s`)}`
}

const renderSpecTests = (tests: TapReporterSpecTest[], indent: string): string[] => {
  return tests.flatMap((test) => {
    const retries = test.retries ? `  ${color.aborted(`(${test.retries} ${test.retries === 1 ? 'retry' : 'retries'})`)}` : ''

    return [
      `${indent}${chalk.dim(test.id.padStart(3))}  ${stateBadge[test.state].icon} ${test.title}${testDuration(test.duration)}${retries}`,
      // Nested under the title, the way the app reporter lists a retried
      // test's attempts; the id column stays empty so the rows read as one test.
      ...(test.attempts ?? []).map((attempt) => {
        return `${indent}       ${stateBadge[attempt.state].icon} ${chalk.dim(`attempt ${attempt.attempt}`)}${testDuration(attempt.duration)}`
      }),
    ]
  })
}

// The app reporter renders each suite as its own section headed by the full
// suite path — depth shows in the breadcrumb, not in indentation — styled here
// like the single-test view's hook section titles. The wire shape is already
// flattened that way: one entry per suite with direct tests, title pre-joined.
const specSuiteSections = (suites: TapReporterSuite[]): string[][] => {
  return suites.map((suite) => [heading(suite.title.toUpperCase()), ...renderSpecTests(suite.tests, '  ')])
}

export const renderReporterSpecHuman = (view: TapReporterSpecView): string => {
  const header = [
    ...(view.spec ? [chalk.bold(view.spec)] : []),
    statsLine(view.stats),
  ]

  const sections = [
    ...(view.tests.length ? [renderSpecTests(view.tests, '  ')] : []),
    ...specSuiteSections(view.suites),
  ]

  const blocks: string[][] = [
    header,
    ...(sections.length ? sections : [[emptyState('No tests were found in this spec.')]]),
  ]

  return layout(blocks)
}
