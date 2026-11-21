// @ts-check
// Checks a regex with recheck, then times it against sample inputs and against
// recheck's attack string at growing sizes. See
// guides/writing-performant-regular-expressions.md for the procedure.
const fs = require('fs')
const { parseArgs } = require('util')
const { Worker } = require('worker_threads')
const recheck = require('recheck')

const SIZES = [1_000, 10_000, 50_000]
const TIMEOUT_MS = 2_000

const USAGE = `Usage: yarn check-regex '/<source>/<flags>' [--samples <file>] [--attack-from '/<source>/<flags>']

  --samples      Real inputs, one per line, or a JSON array of strings in a .json file
  --attack-from  Also time against another regex's attack string, such as the one this replaces

Exits 1 when recheck does not rate the regex safe or a run takes longer than ${TIMEOUT_MS} ms.`

/**
 * `'/a+b/gi'` becomes `{ source: 'a+b', flags: 'gi' }`. Anything else is
 * treated as a source with no flags.
 * @param {string} arg
 */
const parsePatternArg = (arg) => {
  const literal = /^\/([\s\S]+)\/([a-z]*)$/.exec(arg)

  return literal ? { source: literal[1], flags: literal[2] } : { source: arg, flags: '' }
}

/**
 * Grows recheck's attack to about `length` characters: at length 10,
 * `{ pumps: [{ prefix: 'x', pump: 'ab', bias: 1 }], suffix: '!' }` becomes
 * `'xabababab!'`. Each pump contributes `prefix + pump.repeat(n + bias)` and
 * the suffix follows, which is how recheck builds `attack.string` from `base`.
 * @param {{ pumps: { prefix: string, pump: string, bias: number }[], suffix: string }} attack
 * @param {number} length
 */
const buildAttackString = (attack, length) => {
  const fixed = attack.pumps.reduce((sum, { prefix, pump, bias }) => sum + prefix.length + pump.length * bias, attack.suffix.length)
  const perRepeat = attack.pumps.reduce((sum, { pump }) => sum + pump.length, 0)
  const repeats = Math.max(1, Math.floor((length - fixed) / perRepeat))

  return attack.pumps.map(({ prefix, pump, bias }) => prefix + pump.repeat(repeats + bias)).join('') + attack.suffix
}

// Runs in a worker so the main thread can stop it: a catastrophically
// backtracking regex blocks its own thread, so a timer there would not fire
// until the regex returned.
const WORKER_SOURCE = `
const { parentPort, workerData: { source, flags, input } } = require('worker_threads')
const re = new RegExp(source, flags)
const start = performance.now()
const matched = (re.global ? input.match(re) : re.exec(input)) !== null
parentPort.postMessage({ ms: performance.now() - start, matched })
`

/**
 * @param {{ source: string, flags: string }} pattern
 * @param {string} input
 * @returns {Promise<{ ms: number, matched: boolean } | null>} null when the run hit the time cap
 */
const timeRegex = ({ source, flags }, input) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_SOURCE, { eval: true, workerData: { source, flags, input } })
    const timer = setTimeout(() => worker.terminate().then(() => resolve(null), reject), TIMEOUT_MS)

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'samples': { type: 'string' },
      'attack-from': { type: 'string' },
      'help': { type: 'boolean', short: 'h' },
    },
  })

  if (values.help || positionals.length !== 1) {
    console.log(USAGE)

    return values.help ? 0 : 2
  }

  const pattern = parsePatternArg(positionals[0])

  // Throws the engine's own syntax error, which says more than recheck's `unknown`
  new RegExp(pattern.source, pattern.flags)

  const diagnostics = await recheck.check(pattern.source, pattern.flags)

  console.log(`/${pattern.source}/${pattern.flags}`)
  console.log(`  recheck:    ${diagnostics.status}`)

  if (diagnostics.status === 'unknown') {
    console.log(`  error:      ${diagnostics.error.kind}`)
  } else {
    console.log(`  complexity: ${diagnostics.complexity.summary}`)
  }

  const attacks = []

  if (diagnostics.status === 'vulnerable') {
    console.log(`  attack:     ${diagnostics.attack.pattern}`)
    attacks.push({ name: 'attack', attack: diagnostics.attack })
  }

  if (values['attack-from']) {
    const from = parsePatternArg(values['attack-from'])
    const fromDiagnostics = await recheck.check(from.source, from.flags)

    if (fromDiagnostics.status !== 'vulnerable') {
      throw new Error(`--attack-from: recheck rates /${from.source}/${from.flags} ${fromDiagnostics.status}, so it has no attack string`)
    }

    attacks.push({ name: 'borrowed attack', attack: fromDiagnostics.attack })
  }

  const inputs = values.samples ? (await readSamples(values.samples)).map((input, i) => ({ name: `sample ${i + 1}`, input })) : []

  for (const { name, attack } of attacks) {
    for (const size of SIZES) {
      inputs.push({ name: `${name} @ ${size}`, input: buildAttackString(attack, size) })
    }
  }

  const rows = []

  for (const { name, input } of inputs) {
    const result = await timeRegex(pattern, input)

    rows.push({ input: name, chars: input.length, match: result?.matched ?? '-', ms: result ? Number(result.ms.toFixed(3)) : `> ${TIMEOUT_MS}` })
  }

  if (rows.length) {
    console.table(rows)
    console.log('Timings are from this machine only. Compare them with each other, not with numbers measured elsewhere.')
  }

  return diagnostics.status === 'safe' && rows.every((row) => typeof row.ms === 'number') ? 0 : 1
}

module.exports = { buildAttackString, parsePatternArg }

if (require.main === module) {
  main().then((code) => {
    process.exitCode = code
  }, (err) => {
    console.error(err.message)
    process.exitCode = 2
  })
}
