import chalk from 'chalk'

import type { TapNetworkInfo, TapReporterCommand, TapReporterError, TapReporterView } from '@packages/cypress-instances'

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
  muted: chalk.hex('#9095ad'), // $gray-500
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

const aliasBadge = (alias: string): string => color.alias(`@${alias}`)

// Driver messages emphasize with markdown-style `**`; render the emphasis
// instead of the markers, on one line.
const emphasize = (message: string, strong: (part: string) => string): string => {
  return message
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\*\*([^*]+)\*\*/g, (_, part) => strong(part))
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

  return emphasize(message, (part) => chalk.bold(part))
}

const routesTable = (routes: TapReporterView['routes']): string[] => {
  const header = ['METHOD', 'MATCHER', 'STUBBED', 'ALIAS', '#']

  const rows = routes.map((route) => {
    return [
      route.method ?? '',
      route.url ?? '',
      route.stubbed ? 'yes' : 'no',
      route.alias ? `@${route.alias}` : '',
      String(route.numResponses ?? 0),
    ]
  })

  const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => row[column].length)))
  const pad = (cells: string[]) => cells.map((cell, column) => cell.padEnd(widths[column]))

  // Pad before coloring: the escape codes chalk adds would otherwise count
  // toward the column width.
  const colorize = (cells: string[]) => {
    return [
      chalk.bold(cells[0]),
      cells[1],
      cells[2].startsWith('yes') ? color.aborted(cells[2]) : cells[2],
      color.alias(cells[3]),
      cells[4],
    ]
  }

  return [
    chalk.dim('ROUTES') + chalk.dim(` (${routes.length})`),
    `  ${pad(header).map((cell) => chalk.dim(cell)).join('  ')}`,
    ...rows.map((row) => `  ${colorize(pad(row)).join('  ')}`),
  ]
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

const isNumbered = (command: TapReporterCommand): boolean => {
  return command.event !== true && command.type !== 'system'
}

const networkSuffix = (network: TapNetworkInfo | undefined): string => {
  if (!network) {
    return ''
  }

  const parts = [
    ...(network.alias ? [aliasBadge(network.alias)] : []),
    ...(network.stubbed ? [chalk.dim('(stubbed)')] : []),
  ]

  return parts.length ? `  ${parts.join(' ')}` : ''
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

// Event logs render the way the reporter shows them: unnumbered, labeled by
// their display name, as an annotation of the surrounding command.
const renderEventRow = (command: TapReporterCommand, numberWidth: number): string => {
  const { groupIndent, dot, message, cleaned } = rowParts(command)
  const label = chalk.dim(`(${command.displayName ?? command.name ?? '?'})`)
  const blank = ' '.repeat(numberWidth)

  return `  ${blank}  ${groupIndent}  ${label} ${dot}${chalk.italic(message)}${networkSuffix(command.network)}${cleaned}`
}

// Child commands render dash-prefixed, the way the reporter marks a command
// chained off the previous subject.
const commandLabel = (command: TapReporterCommand): string => {
  return `${command.type === 'child' ? '-' : ''}${command.name ?? ''}`
}

const renderCommandRow = (command: TapReporterCommand, number: number, numberWidth: number, nameWidth: number): string => {
  const { groupIndent, dot, message, cleaned } = rowParts(command)
  const num = chalk.dim(String(number).padStart(numberWidth))
  const name = commandLabel(command).padEnd(nameWidth)
  const styledName = command.state === 'failed' ? color.fail.bold(name) : chalk.bold(name)

  return `  ${num}  ${groupIndent}${styledName}  ${dot}${message}${networkSuffix(command.network)}${stateSuffix(command)}${cleaned}`
}

const renderRow = (command: TapReporterCommand, number: number, numberWidth: number, nameWidth: number): string => {
  return isNumbered(command)
    ? renderCommandRow(command, number, numberWidth, nameWidth)
    : renderEventRow(command, numberWidth)
}

const renderSection = (section: Section, hookName: string, numberWidth: number): string[] => {
  const numbered = section.rows.filter(isNumbered)
  const nameWidth = Math.max(0, ...numbered.map((command) => commandLabel(command).length))

  let number = 0

  return [
    chalk.dim(hookName.toUpperCase()),
    ...section.rows.map((command) => {
      if (isNumbered(command)) {
        number += 1
      }

      return renderRow(command, number, numberWidth, nameWidth)
    }),
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

  const numberWidth = Math.max(1, ...sections.map((section) => String(section.rows.filter(isNumbered).length).length))

  const blocks: string[][] = [
    [`${icon} ${chalk.bold(view.test.fullTitle)}  ${word}`],
    ...(view.routes.length ? [routesTable(view.routes)] : []),
    ...sections.map((section) => renderSection(section, hookNames.get(section.hookId ?? '') ?? 'commands', numberWidth)),
  ]

  if (!view.commands.length) {
    blocks.push([chalk.dim('No commands were logged for this test.')])
  }

  if (view.error) {
    blocks.push(renderError(view.error))
  }

  return blocks.map((block) => block.map((line) => line.trimEnd()).join('\n')).join('\n\n')
}
