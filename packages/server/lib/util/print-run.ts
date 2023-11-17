/* eslint-disable no-console */
import _ from 'lodash'
import logSymbols from 'log-symbols'
import chalk from 'chalk'
import human from 'human-interval'
import prettyBytes from 'pretty-bytes'
import pkg from '@packages/root'
import humanTime from './human_time'
import duration from './duration'
import newlines from './newlines'
import env from './env'
import terminal from './terminal'
import { getIsCi } from './ci_provider'
import * as experiments from '../experiments'
import type { SpecFile } from '@packages/types'
import type { Cfg } from '../project-base'
import type { Browser } from '../browsers/types'
import type { Table } from 'cli-table3'
import type { CypressRunResult } from '../modes/results'

type Screenshot = {
  width: number
  height: number
  path: string
  specName: string
}

export const cloudRecommendationMessage = `
  Having trouble debugging your CI failures?

  Record your runs to Cypress Cloud to watch video recordings for each test,
  debug failing and flaky tests, and integrate with your favorite tools.
`

function color (val: any, c: string) {
  return chalk[c](val)
}

export function gray (val: any) {
  return color(val, 'gray')
}

function colorIf (val: any, c: string) {
  if (val === 0 || val == null) {
    val = '-'
    c = 'gray'
  }

  return color(val, c)
}

function getWidth (table: Table, index: number) {
  // get the true width of a table's column,
  // based off of calculated table options for that column
  const columnWidth = table.options.colWidths[index]

  if (columnWidth) {
    return columnWidth - (table.options.style['padding-left'] + table.options.style['padding-right'])
  }

  throw new Error('Unable to get width for column')
}

function formatBrowser (browser: Browser) {
  return _.compact([
    browser.displayName,
    browser.majorVersion,
    browser.isHeadless && gray('(headless)'),
  ]).join(' ')
}

function formatFooterSummary (results: any) {
  const { totalFailed, runs } = results

  const isCanceled = _.some(results.runs, { skippedSpec: true })

  // pass or fail color
  const c = isCanceled ? 'magenta' : totalFailed ? 'red' : 'green'

  const phrase = (() => {
    if (isCanceled) {
      return 'The run was canceled'
    }

    // if we have any specs failing...
    if (!totalFailed) {
      return 'All specs passed!'
    }

    // number of specs
    const total = runs.length
    const failingRuns = _.filter(runs, 'stats.failures').length
    const percent = Math.round((failingRuns / total) * 100)

    return `${failingRuns} of ${total} failed (${percent}%)`
  })()

  return [
    isCanceled ? '-' : formatSymbolSummary(totalFailed),
    color(phrase, c),
    gray(duration.format(results.totalDuration)),
    colorIf(results.totalTests, 'reset'),
    colorIf(results.totalPassed, 'green'),
    colorIf(totalFailed, 'red'),
    colorIf(results.totalPending, 'cyan'),
    colorIf(results.totalSkipped, 'blue'),
  ]
}

function formatSymbolSummary (failures: number) {
  return failures ? logSymbols.error : logSymbols.success
}

function macOSRemovePrivate (str: string) {
  // consistent snapshots when running system tests on macOS
  if (process.platform === 'darwin' && str.startsWith('/private')) {
    return str.slice(8)
  }

  return str
}

function collectTestResults (obj: { video?: boolean, screenshots?: Screenshot[], spec?: any, stats?: any }, estimated: number) {
  return {
    name: _.get(obj, 'spec.name'),
    relativeToCommonRoot: _.get(obj, 'spec.relativeToCommonRoot'),
    tests: _.get(obj, 'stats.tests'),
    passes: _.get(obj, 'stats.passes'),
    pending: _.get(obj, 'stats.pending'),
    failures: _.get(obj, 'stats.failures'),
    skipped: _.get(obj, 'stats.skipped'),
    duration: humanTime.long(_.get(obj, 'stats.wallClockDuration')),
    estimated: estimated && humanTime.long(estimated),
    screenshots: obj.screenshots && obj.screenshots.length,
    video: Boolean(obj.video),
  }
}

function formatPath (name: string, n: number | undefined, pathColor = 'reset') {
  if (!name) return ''

  const fakeCwdPath = env.get('FAKE_CWD_PATH')

  if (fakeCwdPath && env.get('CYPRESS_INTERNAL_ENV') === 'test') {
    // if we're testing within Cypress, we want to strip out
    // the current working directory before calculating the stdout tables
    // this will keep our snapshots consistent everytime we run
    const cwdPath = process.cwd()

    name = name
    .split(cwdPath)
    .join(fakeCwdPath)

    name = macOSRemovePrivate(name)
  }

  // add newLines at each n char and colorize the path
  if (n) {
    let nameWithNewLines = newlines.addNewlineAtEveryNChar(name, n)

    return `${color(nameWithNewLines, pathColor)}`
  }

  return `${color(name, pathColor)}`
}

function formatNodeVersion ({ resolvedNodeVersion, resolvedNodePath }: Pick<Cfg, 'resolvedNodeVersion' | 'resolvedNodePath'>, width: number) {
  if (resolvedNodePath) return formatPath(`v${resolvedNodeVersion} ${gray(`(${resolvedNodePath})`)}`, width)

  return
}

function formatRecordParams (runUrl?: string, parallel?: boolean, group?: string, tag?: string, autoCancelAfterFailures?: number | false) {
  if (runUrl) {
    return `Tag: ${tag || 'false'}, Group: ${group || 'false'}, Parallel: ${Boolean(parallel)}${autoCancelAfterFailures !== undefined ? `, Auto Cancel After Failures: ${autoCancelAfterFailures}` : ''}`
  }

  return
}

export function displayRunStarting (options: { browser: Browser, config: Cfg, group: string | undefined, parallel?: boolean, runUrl?: string, specPattern: string | RegExp | string[], specs: SpecFile[], tag: string | undefined, autoCancelAfterFailures?: number | false }) {
  const { browser, config, group, parallel, runUrl, specPattern, specs, tag, autoCancelAfterFailures } = options

  console.log('')

  terminal.divider('=')

  console.log('')

  terminal.header('Run Starting', {
    color: ['reset'],
  })

  console.log('')

  const experimental = experiments.getExperimentsFromResolved(config.resolved)
  const enabledExperiments = _.pickBy(experimental, _.property('enabled'))
  const hasExperiments = !process.env.CYPRESS_INTERNAL_SKIP_EXPERIMENT_LOGS && !_.isEmpty(enabledExperiments)

  // if we show Node Version, then increase 1st column width
  // to include wider 'Node Version:'.
  // Without Node version, need to account for possible "Experiments" label
  const colWidths = config.resolvedNodePath ? [16, 84] : (
    hasExperiments ? [14, 86] : [12, 88]
  )

  const table = terminal.table({
    colWidths,
    type: 'outsideBorder',
  }) as Table

  if (!specPattern) throw new Error('No specPattern in displayRunStarting')

  const formatSpecs = (specs) => {
    // 25 found: (foo.spec.js, bar.spec.js, baz.spec.js)
    const names = _.map(specs, 'relativeToCommonRoot')
    const specsTruncated = _.truncate(names.join(', '), { length: 250 })

    const stringifiedSpecs = [
      `${names.length} found `,
      '(',
      specsTruncated,
      ')',
    ]
    .join('')

    return formatPath(stringifiedSpecs, getWidth(table, 1))
  }

  const data = _
  .chain([
    [gray('Cypress:'), pkg.version],
    [gray('Browser:'), formatBrowser(browser)],
    [gray('Node Version:'), formatNodeVersion(config, getWidth(table, 1))],
    [gray('Specs:'), formatSpecs(specs)],
    [gray('Searched:'), formatPath(Array.isArray(specPattern) ? specPattern.join(', ') : String(specPattern), getWidth(table, 1))],
    [gray('Params:'), formatRecordParams(runUrl, parallel, group, tag, autoCancelAfterFailures)],
    [gray('Run URL:'), runUrl ? formatPath(runUrl, getWidth(table, 1)) : ''],
    [gray('Experiments:'), hasExperiments ? experiments.formatExperiments(enabledExperiments) : ''],
  ])
  .filter(_.property(1))
  .value()

  // @ts-expect-error incorrect type in Table
  table.push(...data)

  const heading = table.toString()

  console.log(heading)

  console.log('')

  return heading
}

export function displaySpecHeader (name: string, curr: number, total: number, estimated: number) {
  console.log('')

  const PADDING = 2

  const table = terminal.table({
    colWidths: [10, 70, 20],
    colAligns: ['left', 'left', 'right'],
    type: 'pageDivider',
    style: {
      'padding-left': PADDING,
      'padding-right': 0,
    },
  })

  table.push(['', ''])
  table.push([
    'Running:',
    `${formatPath(name, getWidth(table, 1), 'gray')}`,
    gray(`(${curr} of ${total})`),
  ])

  console.log(table.toString())

  if (estimated) {
    const estimatedLabel = `${' '.repeat(PADDING)}Estimated:`

    return console.log(estimatedLabel, gray(humanTime.long(estimated)))
  }
}

export function maybeLogCloudRecommendationMessage (runs: CypressCommandLine.RunResult[], record: boolean) {
  if (!getIsCi() || env.get('CYPRESS_COMMERCIAL_RECOMMENDATIONS') === '0' || record) {
    return
  }

  if (runs.some((run) => run.stats.failures > 0)) {
    terminal.divider('-')
    console.log(cloudRecommendationMessage)
    console.log(`  >>`, color('https://on.cypress.io/cloud-get-started', 'cyan'))
    console.log('')
    terminal.divider('-')
  }
}

export function renderSummaryTable (runUrl: string | undefined, results: CypressRunResult) {
  const { runs } = results

  console.log('')

  terminal.divider('=')

  console.log('')

  terminal.header('Run Finished', {
    color: ['reset'],
  })

  if (runs && runs.length) {
    const colAligns = ['left', 'left', 'right', 'right', 'right', 'right', 'right', 'right']
    const colWidths = [3, 41, 11, 9, 9, 9, 9, 9]

    const table1 = terminal.table({
      colAligns,
      colWidths,
      type: 'noBorder',
      head: [
        '',
        gray('Spec'),
        '',
        gray('Tests'),
        gray('Passing'),
        gray('Failing'),
        gray('Pending'),
        gray('Skipped'),
      ],
    })

    const table2 = terminal.table({
      colAligns,
      colWidths,
      type: 'border',
    })

    const table3 = terminal.table({
      colAligns,
      colWidths,
      type: 'noBorder',
      head: formatFooterSummary(results),
    })

    _.each(runs, (run) => {
      const { spec, stats } = run

      const ms = duration.format(stats.wallClockDuration || 0)

      const formattedSpec = formatPath(spec.relativeToCommonRoot, getWidth(table2, 1))

      if (run.skippedSpec) {
        return table2.push([
          '-',
          formattedSpec, color('SKIPPED', 'gray'),
          '-', '-', '-', '-', '-',
        ])
      }

      return table2.push([
        formatSymbolSummary(stats.failures),
        formattedSpec,
        color(ms, 'gray'),
        colorIf(stats.tests, 'reset'),
        colorIf(stats.passes, 'green'),
        colorIf(stats.failures, 'red'),
        colorIf(stats.pending, 'cyan'),
        colorIf(stats.skipped, 'blue'),
      ])
    })

    console.log('')
    console.log('')
    console.log(terminal.renderTables(table1, table2, table3))
    console.log('')

    if (runUrl) {
      console.log('')

      const table4 = terminal.table({
        colWidths: [100],
        type: 'pageDivider',
        style: {
          'padding-left': 2,
        },
      })

      table4.push(['', ''])
      console.log(terminal.renderTables(table4))

      console.log(`  Recorded Run: ${formatPath(runUrl, undefined, 'gray')}`)
      console.log('')
    }
  }
}

export function displayResults (obj: { screenshots?: Screenshot[] }, estimated: number) {
  const results = collectTestResults(obj, estimated)

  const c = results.failures ? 'red' : 'green'

  console.log('')

  terminal.header('Results', {
    color: [c],
  })

  const table = terminal.table({
    colWidths: [14, 86],
    type: 'outsideBorder',
  })

  const data = _.chain([
    ['Tests:', results.tests],
    ['Passing:', results.passes],
    ['Failing:', results.failures],
    ['Pending:', results.pending],
    ['Skipped:', results.skipped],
    ['Screenshots:', results.screenshots],
    ['Video:', results.video],
    ['Duration:', results.duration],
    estimated ? ['Estimated:', results.estimated] : undefined,
    ['Spec Ran:', formatPath(results.relativeToCommonRoot, getWidth(table, 1), c)],
  ])
  .compact()
  .map((arr) => {
    const [key, val] = arr

    return [color(key, 'gray'), color(val, c)]
  })
  .value()

  table.push(...data)

  console.log('')
  console.log(table.toString())
  console.log('')

  if (obj.screenshots?.length) displayScreenshots(obj.screenshots)
}

function displayScreenshots (screenshots: Screenshot[] = []) {
  console.log('')

  terminal.header('Screenshots', { color: ['yellow'] })

  console.log('')

  const table = terminal.table({
    colWidths: [3, 82, 15],
    colAligns: ['left', 'left', 'right'],
    type: 'noBorder',
    style: {
      'padding-right': 0,
    },
    chars: {
      'left': ' ',
      'right': '',
    },
  })

  screenshots.forEach((screenshot) => {
    const dimensions = gray(`(${screenshot.width}x${screenshot.height})`)

    table.push([
      '-',
      formatPath(`${screenshot.path}`, getWidth(table, 1)),
      gray(dimensions),
    ])
  })

  console.log(table.toString())

  console.log('')
}

export function displayVideoCompressionProgress (opts: { videoName: string, videoCompression: number | boolean }) {
  console.log('')

  const table = terminal.table({
    colWidths: [3, 21, 76],
    colAligns: ['left', 'left', 'left'],
    type: 'noBorder',
    style: {
      'padding-right': 0,
    },
    chars: {
      'left': ' ',
      'right': '',
    },
  })

  table.push([
    gray('-'),
    gray('Started compressing:'),
    chalk.cyan(`Compressing to ${opts.videoCompression} CRF`),
  ])

  console.log(table.toString())

  const started = Date.now()
  let progress = Date.now()
  const throttle = env.get('VIDEO_COMPRESSION_THROTTLE') || human('10 seconds')

  return {
    onProgress (float: number) {
      if (float === 1) {
        const finished = Date.now() - started
        const dur = `${humanTime.long(finished)}`

        const table = terminal.table({
          colWidths: [3, 22, 60, 15],
          colAligns: ['left', 'left', 'left', 'right'],
          type: 'noBorder',
          style: {
            'padding-right': 0,
          },
          chars: {
            'left': ' ',
            'right': '',
          },
        })

        table.push([
          gray('-'),
          gray('Finished compressing:'),
          gray(dur),
        ])

        console.log(table.toString())
      }

      if (Date.now() - progress > throttle) {
        // bump up the progress so we dont
        // continuously get notifications
        progress += throttle
        const percentage = `${Math.ceil(float * 100)}%`

        console.log('    Compression progress: ', chalk.cyan(percentage))
      }
    },
  }
}

export const printVideoHeader = () => {
  console.log('')

  terminal.header('Video', {
    color: ['cyan'],
  })
}

export const printVideoPath = (videoName?: string) => {
  if (videoName !== undefined) {
    console.log('')

    console.log(`  -  Video output: ${formatPath(videoName, undefined, 'cyan')}`)

    console.log('')
  }
}

const formatFileSize = (bytes: number) => {
  // in test environments, mask the value as it may differ from environment
  // to environment
  if (env.get('CYPRESS_INTERNAL_ENV') === 'test') {
    return prettyBytes(1000)
  }

  return prettyBytes(bytes)
}

type ArtifactLike = {
  reportKey: 'protocol' | 'screenshots' | 'video'
  filePath?: string
  fileSize?: number | BigInt
  message?: string
  skip?: boolean
  error: string
}

export const printPendingArtifactUpload = <T extends ArtifactLike> (artifact: T, labels: Record<'protocol' | 'screenshots' | 'video', string>): void => {
  process.stdout.write(`  - ${labels[artifact.reportKey]} `)

  if (artifact.skip) {
    if (artifact.reportKey === 'protocol' && artifact.error) {
      process.stdout.write(`- Failed Capturing - ${artifact.error}`)
    } else {
      process.stdout.write('- Nothing to upload ')
    }
  }

  if (artifact.reportKey === 'protocol' && artifact.message) {
    process.stdout.write(`- ${artifact.message}`)
  }

  if (artifact.fileSize) {
    process.stdout.write(`- ${formatFileSize(Number(artifact.fileSize))}`)
  }

  if (artifact.filePath) {
    process.stdout.write(` ${formatPath(artifact.filePath, undefined, 'cyan')}`)
  }

  process.stdout.write('\n')
}

type ArtifactUploadResultLike = {
  pathToFile?: string
  key: string
  fileSize?: number | BigInt
  success: boolean
  error?: string
  skipped?: boolean
  duration?: number
}

export const printCompletedArtifactUpload = <T extends ArtifactUploadResultLike> (artifactUploadResult: T, labels: Record<'protocol' | 'screenshots' | 'video', string>, num: string): void => {
  const { pathToFile, key, fileSize, success, error, skipped, duration } = artifactUploadResult

  process.stdout.write(`  - ${labels[key]} `)

  if (success) {
    process.stdout.write(`- Done Uploading ${formatFileSize(Number(fileSize))}`)
  } else if (skipped) {
    process.stdout.write(`- Nothing to Upload`)
  } else {
    process.stdout.write(`- Failed Uploading`)
  }

  if (duration) {
    const durationOut = humanTime.short(duration, 2)

    process.stdout.write(` ${success ? 'in' : 'after'} ${durationOut}`)
  }

  process.stdout.write(` ${num}`)

  if (pathToFile && key !== 'protocol') {
    process.stdout.write(` ${formatPath(pathToFile, undefined, 'cyan')}`)
  }

  if (error) {
    process.stdout.write(` - ${error}`)
  }

  process.stdout.write('\n')
}
