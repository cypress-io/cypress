import chalk from 'chalk'

import type { TapCommandEntry, TapCommandHook, TapNetworkInfo } from '@packages/cypress-instances'
import { color, definitionList, heading, layout, stateBadge } from './format'
import { aliasSuffix, cleanedSuffix, commandLabel, formatMessage, networkDot, networkSuffix } from './command-row'

// The reporter's inline network detail, expanded into its own panel: the row
// message already summarizes the request, so this is where the parts a consumer
// might act on — matcher, status, alias — read individually. Ordered the way the
// reporter's ROUTES table columns are.
const networkEntries = (network: TapNetworkInfo): Array<[string, string]> => {
  const entries: Array<[string, string]> = []
  const add = (label: string, value: string | undefined) => {
    if (value) {
      entries.push([label, value])
    }
  }

  add('METHOD', network.method && chalk.bold(network.method))
  add('URL', network.url)
  add('STATUS', network.status != null ? String(network.status) : undefined)
  add('INDICATOR', network.indicator && `${networkDot(network)}${network.indicator}`)
  add('STUBBED', network.stubbed === undefined ? undefined : network.stubbed ? color.aborted('yes') : 'no')
  add('RESPONSES', network.numResponses != null ? String(network.numResponses) : undefined)
  add('ALIAS', network.alias && color.alias(`@${network.alias}`))

  return entries
}

// One command rendered as the reporter renders its row — state icon, id, name
// (dash-prefixed when chained), network dot, styled message, alias badge — with
// the state spelled out the way the reporter's test header does. A row with no
// state yet (a route registration) simply has no icon and no word.
const entryHeader = (entry: TapCommandEntry): string => {
  const state = entry.state ? stateBadge[entry.state] : undefined
  const name = commandLabel(entry)
  const styledName = entry.state === 'failed' ? color.fail.bold(name) : chalk.bold(name)

  // Unlike the reporter's log, a lone row has no columns to align to, so the
  // parts a row happens to lack close up instead of leaving a gap.
  const head = [
    state?.icon,
    entry.id && chalk.dim(entry.id),
    styledName,
    `${networkDot(entry.network)}${formatMessage(entry)}`.trim(),
  ].filter(Boolean).join('  ')

  const suffixes = `${aliasSuffix(entry, entry.network)}${networkSuffix(entry.network)}${cleanedSuffix(entry)}`

  return `${head}${suffixes}${state ? `  ${state.word}` : ''}`
}

// Which section of the reporter panel the row sits under — the context a lone
// row has no way to show, and what its `<hookId>:<number>` handle qualifies. A
// row of the test body carries no hook, so there is no panel to render.
const hookEntries = (hook: TapCommandHook): Array<[string, string]> => {
  const entries: Array<[string, string]> = [['ID', hook.hookId]]

  if (hook.hookName) {
    entries.push(['NAME', chalk.bold(hook.hookName)])
  }

  return entries
}

export const renderCommandEntryHuman = (entry: TapCommandEntry): string => {
  const network = entry.network && networkEntries(entry.network)

  return layout([
    [entryHeader(entry)],
    ...(entry.hook ? [[heading('HOOK'), ...definitionList(hookEntries(entry.hook))]] : []),
    ...(network?.length ? [[heading('NETWORK'), ...definitionList(network)]] : []),
  ])
}
