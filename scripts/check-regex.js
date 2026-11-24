// @ts-check
// The procedure this runs is in guides/writing-performant-regular-expressions.md
const fs = require('fs')
const { parseArgs } = require('util')
const { Worker } = require('worker_threads')
const recheck = require('recheck')

const WORST_CASE_LENGTHS = [1_000, 10_000, 50_000]
const RUN_TIMEOUT_MS = 2_000

const USAGE = `Usage: yarn check-regex '/<source>/<flags>' [--samples <file>] [--worst-case-from '/<source>/<flags>']

  --samples          Real inputs, one per line, or a JSON array of strings in a .json file
  --worst-case-from  Also time against another regex's worst-case input, such as the one this replaces

Exits 1 when recheck does not rate the regex safe or a run takes longer than ${RUN_TIMEOUT_MS} ms.`

/**
 * `'/a+b/gi'` becomes `{ source: 'a+b', flags: 'gi' }`. Anything else is
 * treated as a source with no flags.
 * @param {string} arg
 */
const parseRegexArg = (arg) => {
  const literal = /^\/([\s\S]+)\/([a-z]*)$/.exec(arg)

  return literal ? { source: literal[1], flags: literal[2] } : { source: arg, flags: '' }
}

/**
 * Builds a worst-case input of about `length` characters from recheck's recipe
 * for it: at length 10, `{ pumps: [{ prefix: 'x', pump: 'ab', bias: 1 }], suffix: '!' }`
 * becomes `'xabababab!'`. Each pump contributes `prefix + pump.repeat(repeats + bias)`
 * and the suffix follows, which is how recheck builds its own `attack.string`
 * from `base`.
 * @param {{ pumps: { prefix: string, pump: string, bias: number }[], suffix: string }} recipe
 * @param {number} length
 */
const buildWorstCaseInput = (recipe, length) => {
  const lengthAtZeroRepeats = recipe.pumps.reduce((sum, { prefix, pump, bias }) => sum + prefix.length + pump.length * bias, recipe.suffix.length)
  const lengthPerRepeat = recipe.pumps.reduce((sum, { pump }) => sum + pump.length, 0)
  const repeats = Math.max(1, Math.floor((length - lengthAtZeroRepeats) / lengthPerRepeat))

  return recipe.pumps.map(({ prefix, pump, bias }) => prefix + pump.repeat(repeats + bias)).join('') + recipe.suffix
}

// Runs in a worker so the main thread can stop it: a catastrophically
// backtracking regex blocks its own thread, so a timer there would not fire
// until the regex returned.
const TIMING_WORKER_CODE = `
const { parentPort, workerData: { source, flags, input } } = require('worker_threads')
const regex = new RegExp(source, flags)
const start = performance.now()
const matched = (regex.global ? input.match(regex) : regex.exec(input)) !== null
parentPort.postMessage({ durationMs: performance.now() - start, matched })
`

/**
 * @param {{ source: string, flags: string }} regex
 * @param {string} input
 * @returns {Promise<{ durationMs: number, matched: boolean } | null>} null when the run hit the time cap
 */
const timeRegex = ({ source, flags }, input) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(TIMING_WORKER_CODE, { eval: true, workerData: { source, flags, input } })
    const timer = setTimeout(() => worker.terminate().then(() => resolve(null), reject), RUN_TIMEOUT_MS)

    worker.once('message', (result) => {
      clearTimeout(timer)
      worker.terminate().then(() => resolve(result), reject)
    })

    worker.once('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

/**
 * @param {string} file
 * @returns {Promise<string[]>}
 */
const readSamples = async (file) => {
  const text = await fs.promises.readFile(file, 'utf8')

  return file.endsWith('.json') ? JSON.parse(text) : text.split(/\r?\n/).filter(Boolean)
}

const main = async () => {
  const { values: options, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'samples': { type: 'string' },
      'worst-case-from': { type: 'string' },
      'help': { type: 'boolean', short: 'h' },
    },
  })

  if (options.help || positionals.length !== 1) {
    console.log(USAGE)

    return options.help ? 0 : 2
  }

  const regex = parseRegexArg(positionals[0])

  // Throws the engine's own syntax error, which says more than recheck's `unknown`
  new RegExp(regex.source, regex.flags)

  const recheckResult = await recheck.check(regex.source, regex.flags)

  console.log(`/${regex.source}/${regex.flags}`)
  console.log(`  recheck:    ${recheckResult.status}`)

  if (recheckResult.status === 'unknown') {
    console.log(`  error:      ${recheckResult.error.kind}`)
  } else {
    console.log(`  complexity: ${recheckResult.complexity.summary}`)
  }

  const worstCaseRecipes = []

  if (recheckResult.status === 'vulnerable') {
    console.log(`  worst case: ${recheckResult.attack.pattern}`)
    worstCaseRecipes.push({ label: 'worst case', recipe: recheckResult.attack })
  }

  if (options['worst-case-from']) {
    const otherRegex = parseRegexArg(options['worst-case-from'])
    const otherRecheckResult = await recheck.check(otherRegex.source, otherRegex.flags)

    if (otherRecheckResult.status !== 'vulnerable') {
      throw new Error(`--worst-case-from: recheck rates /${otherRegex.source}/${otherRegex.flags} ${otherRecheckResult.status}, so it has no worst-case input`)
    }

    worstCaseRecipes.push({ label: 'borrowed worst case', recipe: otherRecheckResult.attack })
  }

  const inputs = options.samples ? (await readSamples(options.samples)).map((input, i) => ({ label: `sample ${i + 1}`, input })) : []

  for (const { label, recipe } of worstCaseRecipes) {
    for (const length of WORST_CASE_LENGTHS) {
      inputs.push({ label: `${label} @ ${length}`, input: buildWorstCaseInput(recipe, length) })
    }
  }

  const rows = []

  for (const { label, input } of inputs) {
    const timing = await timeRegex(regex, input)

    rows.push({ input: label, chars: input.length, match: timing?.matched ?? '-', ms: timing ? Number(timing.durationMs.toFixed(3)) : `> ${RUN_TIMEOUT_MS}` })
  }

  if (rows.length) {
    console.table(rows)
    console.log('Timings are from this machine only. Compare them with each other, not with numbers measured elsewhere.')
  }

  return recheckResult.status === 'safe' && rows.every((row) => typeof row.ms === 'number') ? 0 : 1
}

module.exports = { buildWorstCaseInput, parseRegexArg }

if (require.main === module) {
  main().then((code) => {
    process.exitCode = code
  }, (err) => {
    console.error(err.message)
    process.exitCode = 2
  })
}
