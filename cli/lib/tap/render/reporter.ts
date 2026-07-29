import chalk from 'chalk'

import type { TapNetworkInfo, TapReporterAgent, TapReporterCommand, TapReporterError, TapReporterSession, TapReporterView } from '@packages/cypress-instances'

// The reporter's own palette (packages/reporter/src/lib/variables.scss and
// commands.scss), so the CLI rendering matches the app: $pass/$fail map to
// jade-400/red-400, assert messages render jade-300/red-400 with jade-200/
// red-300 emphasis, the network dots use the command-message-indicator colors,
// and aliases take the purple badge hue. chalk downsamples the hex values on
// terminals without truecolor.
const color = {
  pass: chalk.hex('#1fa971'), // $jade-400
  fail: chalk.hex('#e45770'), // $red-400
  passMessage: chalk.hex('#69d3a7'), // $jade-300
  passStrong: chalk.hex('#a3e7cb'), // $jade-200
  failStrong: chalk.hex('#f59aa9'), // $red-300
  errHeaderText: chalk.hex('#f59aa9'), // $err-header-text = $red-300
  aborted: chalk.hex('#db7903'), // $orange-400
  bad: chalk.hex('#c62b49'), // $red-500
  pending: chalk.hex('#6470f3'), // $indigo-400
  alias: chalk.hex('#c8a7f5'), // $purple-300
  aliasDom: chalk.hex('#9aa2fc'), // $indigo-300 — the reporter colors dom aliases indigo
  muted: chalk.hex('#9095ad'), // $gray-500
  fadedId: chalk.hex('#5a5f7a'), // $gray-700 — event ids sit back from the command numbers
}

const TEST_STATE = {
  passed: { icon: color.pass('✓'), word: color.pass('passed') },
  failed: { icon: color.fail('✖'), word: color.fail('failed') },
  pending: { icon: color.pending('○'), word: color.pending('pending') },
  skipped: { icon: color.muted('-'), word: color.muted('skipped') },
} as const

// The reporter's status dot for a network row.
const INDICATORS: Record<NonNullable<TapNetworkInfo['indicator']>, string> = {
  successful: color.pass('●'),
  pending: color.pending('○'),
  aborted: color.aborted('●'),
  bad: color.bad('●'),
}

// The reporter's tag palette: dom aliases indigo, everything else
// (route/agent/primitive) purple.
const aliasColor = (aliasType: string | undefined) => (aliasType === 'dom' ? color.aliasDom : color.alias)

const aliasBadge = (alias: string, aliasType?: string): string => aliasColor(aliasType)(`@${alias}`)

// Driver messages emphasize with markdown-style `**`; render the emphasis
// instead of the markers, on one line.
const emphasize = (message: string, strong: (part: string) => string): string => {
  return message
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\*\*([^*]+)\*\*/g, (_, part) => strong(part))
}

// The `@name`s a row references (cy.get('@x') / cy.wait('@x')) appear verbatim
// in its message — give them the alias badge color in place.
const colorizeAliasReferences = (message: string, command: TapReporterCommand): string => {
  const { referencedAliases, aliasType } = command

  if (!referencedAliases?.length) {
    return message
  }

  const names = new Set(referencedAliases)

  return message.replace(/@([\w-]+)/g, (match, name) => (names.has(name) ? aliasColor(aliasType)(match) : match))
}

// Asserts take the reporter's state colors — passing green, failing red —
// while other messages keep the default text with bold emphasis.
const formatMessage = (command: TapReporterCommand): string => {
  const message = command.message ?? ''

  if (!message) {
    return ''
  }

  if (command.name === 'assert') {
    if (command.state === 'passed') {
      return color.passMessage(emphasize(message, (part) => color.passStrong.bold(part)))
    }

    if (command.state === 'failed') {
      return color.fail(emphasize(message, (part) => color.failStrong.bold(part)))
    }
  }

  return colorizeAliasReferences(emphasize(message, (part) => chalk.bold(part)), command)
}

// Pad before coloring: the escape codes chalk adds would otherwise count
// toward the column width.
const panelTable = (title: string, header: string[], rows: string[][], colorize: (cells: string[]) => string[]): string[] => {
  const widths = header.map((cell, column) => Math.max(cell.length, ...rows.map((row) => row[column].length)))
  const pad = (cells: string[]) => cells.map((cell, column) => cell.padEnd(widths[column]))

  return [
    chalk.dim(`${title} (${rows.length})`),
    `  ${pad(header).map((cell) => chalk.dim(cell)).join('  ')}`,
    ...rows.map((row) => `  ${colorize(pad(row)).join('  ')}`),
  ]
}

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
    chalk.dim(`SESSIONS (${sessions.length})`),
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

  return panelTable('SPIES / STUBS', ['TYPE', 'FUNCTION', 'ALIAS(ES)', 'CALLS'], rows, (cells) => {
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

  return panelTable('ROUTES', ['METHOD', 'MATCHER', 'STUBBED', 'ALIAS', '#'], rows, (cells) => {
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

// A row's alias badge(s): its own aliases (`.as()` definitions, spy/stub call
// rows) or the alias its request matched.
const aliasSuffix = (command: TapReporterCommand, network: TapNetworkInfo | undefined): string => {
  const names = command.aliases ?? (network?.alias != null ? [network.alias] : [])

  return names.length ? `  ${names.map((name) => aliasBadge(name, command.aliasType)).join(' ')}` : ''
}

const networkSuffix = (network: TapNetworkInfo | undefined): string => {
  return network?.stubbed ? `  ${chalk.dim('(stubbed)')}` : ''
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
    dot: command.network?.indicator ? `${INDICATORS[command.network.indicator]} ` : '',
    message: formatMessage(command),
    cleaned: command.cleanedUp ? `  ${chalk.dim('(cleaned up)')}` : '',
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

// Child commands render dash-prefixed, the way the reporter marks a command
// chained off the previous subject.
const commandLabel = (command: TapReporterCommand): string => {
  return `${command.type === 'child' ? '-' : ''}${command.name ?? ''}`
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
    chalk.dim(`${hookName.toUpperCase()}${qualifier}`),
    ...section.rows.map((command) => renderRow(command, idWidth, nameWidth)),
  ]
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
  const { icon, word } = TEST_STATE[view.test.state]
  const hookNames = new Map(view.hooks.map(({ hookId, hookName }) => [hookId, hookName]))
  const sections = sectionize(view.commands)

  const idWidth = Math.max(2, ...view.commands.map((command) => command.id.length))

  const blocks: string[][] = [
    [`${icon} ${chalk.bold(view.test.fullTitle)}  ${word}`],
    ...(view.sessions.length ? [sessionsPanel(view.sessions)] : []),
    ...(view.agents.length ? [agentsTable(view.agents)] : []),
    ...(view.routes.length ? [routesTable(view.routes)] : []),
    ...sections.map((section) => renderSection(section, hookNames.get(section.hookId ?? '') ?? 'commands', idWidth)),
  ]

  if (!view.commands.length) {
    blocks.push([chalk.dim('No commands were logged for this test.')])
  }

  if (view.error) {
    blocks.push(renderError(view.error))
  }

  return blocks.map((block) => block.map((line) => line.trimEnd()).join('\n')).join('\n\n')
}
