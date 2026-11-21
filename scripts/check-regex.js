// @ts-check
// Measures a regular expression before it is added or changed: a static
// ReDoS check with recheck, then timings against sample inputs and against
// recheck's attack string at growing sizes. See
// guides/writing-performant-regular-expressions.md for the procedure.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { Worker } = require('worker_threads')
const ts = require('typescript')

const RECHECK_VERSION = '4.6.2'
const RECHECK_DIR = process.env.CHECK_REGEX_RECHECK_DIR || path.join(os.homedir(), '.cache', 'cypress-check-regex')
const DEFAULT_SIZES = [1_000, 10_000, 50_000]
const DEFAULT_TIMEOUT_MS = 2_000

const USAGE = `Usage:
  yarn check-regex '/<source>/<flags>' [options]
  yarn check-regex '<source>' --flags <flags> [options]
  yarn check-regex <file>:<line> [options]

Options:
  --flags <flags>     Flags for a bare <source>
  --samples <file>    Realistic inputs, one per line (or a JSON array of strings in a .json file)
  --input <file>      Use the whole file as one realistic input (repeatable)
  --attack-from <re>  Also time against another regex's attack string, such as the
                      pattern this one replaces ('/<source>/<flags>')
  --sizes <list>      Attack string lengths in characters (default: ${DEFAULT_SIZES.join(',')})
  --timeout <ms>      Time cap per run (default: ${DEFAULT_TIMEOUT_MS})
  --help              Show this message

Exits 1 when recheck does not rate a regex safe or a run hits the time cap.`

/**
 * @typedef {{ source: string, flags: string, label: string }} Target
 */

/**
 * `'/a+b/gi'` becomes `{ source: 'a+b', flags: 'gi' }`. A string that does not
 * look like a regex literal is returned as the source with no flags.
 * @param {string} arg
 */
const parsePatternArg = (arg) => {
  const literal = /^\/([\s\S]+)\/([a-z]*)$/.exec(arg)

  if (literal) {
    return { source: literal[1], flags: literal[2] }
  }

  return { source: arg, flags: '' }
}

/**
 * Returns every regex that starts on `line` (1-based) of `code`: regex
 * literals, and `RegExp(...)` / `new RegExp(...)` calls whose arguments are
 * string literals. A `RegExp` built from a variable is skipped, since its
 * source is only known at runtime.
 * @param {string} code
 * @param {number} line
 * @param {string} fileName
 * @returns {Target[]}
 */
const findRegexesOnLine = (code, line, fileName = 'input.ts') => {
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true)
  /** @type {Target[]} */
  const found = []

  /** @param {ts.Node} node */
  const startLine = (node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

  /** @param {ts.Node | undefined} node */
  const isStringLiteral = (node) => !!node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))

  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isRegularExpressionLiteral(node) && startLine(node) === line) {
      found.push({ ...parsePatternArg(node.text), label: node.text })
    }

    if ((ts.isNewExpression(node) || ts.isCallExpression(node)) &&
      ts.isIdentifier(node.expression) && node.expression.text === 'RegExp' &&
      startLine(node) === line) {
      const [sourceArg, flagsArg] = node.arguments ?? []

      if (sourceArg && ts.isStringLiteralLike(sourceArg) && (!flagsArg || isStringLiteral(flagsArg))) {
        const flags = flagsArg && ts.isStringLiteralLike(flagsArg) ? flagsArg.text : ''

        found.push({ source: sourceArg.text, flags, label: node.getText(sourceFile) })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return found
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
const { parentPort, workerData } = require('worker_threads')
const { performance } = require('perf_hooks')
const { source, flags, input } = workerData
const re = new RegExp(source, flags)
const run = () => re.global ? input.match(re) : re.exec(input)
const times = []
let result

for (let i = 0; i < 5; i++) {
  re.lastIndex = 0
  const start = performance.now()
  result = run()
  times.push(performance.now() - start)
  if (times.reduce((a, b) => a + b, 0) > 200) break
}

times.sort((a, b) => a - b)
parentPort.postMessage({ ms: times[Math.floor(times.length / 2)], matched: result !== null })
`

/**
 * @param {string} source
 * @param {string} flags
 * @param {string} input
 * @param {number} timeoutMs
 * @returns {Promise<{ ms: number, matched: boolean } | { timedOut: true }>}
 */
const timeRegex = (source, flags, input, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_SOURCE, { eval: true, workerData: { source, flags, input } })
    const timer = setTimeout(() => {
      worker.terminate().then(() => resolve({ timedOut: true }), reject)
    }, timeoutMs)

    worker.once('message', (message) => {
      clearTimeout(timer)
      worker.terminate().then(() => resolve(message), reject)
    })

    worker.once('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

const loadRecheck = () => {
  // Kept out of the repo's dependencies: it ships a native binary per platform
  // that every install would download for a check run by hand
  const name = 'recheck'

  for (const from of [__dirname, RECHECK_DIR]) {
    try {
      return require(require.resolve(name, { paths: [from] }))
    } catch {
      // try the next location
    }
  }

  return null
}

// `yarn check-regex` runs from the repo root, so relative paths are resolved
// against the directory the command was typed in
const fromCaller = (/** @type {string} */ file) => path.resolve(process.env.INIT_CWD || process.cwd(), file)

/**
 * @param {string[]} argv
 */
const parseArgs = (argv) => {
  /** @type {{ target?: string, flags?: string, samples?: string, attackFrom?: string, inputs: string[], sizes: number[], timeout: number, help: boolean }} */
  const options = { inputs: [], sizes: DEFAULT_SIZES, timeout: DEFAULT_TIMEOUT_MS, help: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = () => {
      const value = argv[++i]

      if (value === undefined) throw new Error(`${arg} needs a value`)

      return value
    }

    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--flags') options.flags = next()
    else if (arg === '--samples') options.samples = next()
    else if (arg === '--input') options.inputs.push(next())
    else if (arg === '--attack-from') options.attackFrom = next()
    else if (arg === '--sizes') options.sizes = next().split(',').map(Number)
    else if (arg === '--timeout') options.timeout = Number(next())
    else if (options.target === undefined) options.target = arg
    else throw new Error(`Unexpected argument: ${arg}`)
  }

  return options
}

/**
 * @param {string} target
 * @param {string | undefined} flags
 * @returns {Promise<Target[]>}
 */
const resolveTargets = async (target, flags) => {
  const fileLine = /^(.+):(\d+)$/.exec(target)

  if (fileLine && fs.existsSync(fromCaller(fileLine[1]))) {
    const found = findRegexesOnLine(await fs.promises.readFile(fromCaller(fileLine[1]), 'utf8'), Number(fileLine[2]), fileLine[1])

    if (!found.length) {
      throw new Error(`No regex literal or RegExp() call with literal arguments starts on ${target}. Pass the pattern itself instead.`)
    }

    return found
  }

  const parsed = parsePatternArg(target)

  return [{ source: parsed.source, flags: flags ?? parsed.flags, label: `/${parsed.source}/${flags ?? parsed.flags}` }]
}

/**
 * @param {string | undefined} samplesFile
 * @param {string[]} inputFiles
 */
const readSamples = async (samplesFile, inputFiles) => {
  /** @type {{ name: string, input: string }[]} */
  const samples = []

  if (samplesFile) {
    const text = await fs.promises.readFile(fromCaller(samplesFile), 'utf8')
    const values = samplesFile.endsWith('.json') ? JSON.parse(text) : text.split(/\r?\n/).filter((l) => l.length)

    values.forEach((input, i) => samples.push({ name: `${path.basename(samplesFile)} #${i + 1}`, input: String(input) }))
  }

  for (const file of inputFiles) {
    samples.push({ name: path.basename(file), input: await fs.promises.readFile(fromCaller(file), 'utf8') })
  }

  return samples
}

/**
 * @param {Target} target
 * @param {any} recheck
 * @param {{ name: string, input: string }[]} samples
 * @param {{ sizes: number[], timeout: number }} options
 * @param {{ label: string, attack: any } | null} borrowed attack string from --attack-from
 */
const checkTarget = async (target, recheck, samples, options, borrowed) => {
  let ok = true

  try {
    new RegExp(target.source, target.flags)
  } catch (err) {
    console.log(`${target.label}\n  invalid: ${err instanceof Error ? err.message : err}\n`)

    return false
  }

  console.log(target.label)

  const diagnostics = await recheck.check(target.source, target.flags)

  console.log(`  recheck:    ${diagnostics.status}${diagnostics.checker ? ` (${diagnostics.checker})` : ''}`)

  if (diagnostics.status === 'unknown') {
    console.log(`  error:      ${diagnostics.error.kind}${diagnostics.error.message ? `: ${diagnostics.error.message}` : ''}`)
  } else {
    console.log(`  complexity: ${diagnostics.complexity.summary}`)
  }

  if (diagnostics.status !== 'safe') ok = false

  if (diagnostics.status === 'vulnerable') {
    const marks = Array.from({ length: target.source.length }, () => ' ')

    for (const { start, end, temperature } of diagnostics.hotspot) {
      for (let i = start; i < end; i++) marks[i] = temperature === 'heat' ? '^' : '~'
    }

    console.log(`  hotspot:    ${target.source}\n              ${marks.join('').trimEnd()}`)
    console.log(`  attack:     ${diagnostics.attack.pattern}`)
  }

  /** @type {{ name: string, input: string }[]} */
  const runs = [...samples]

  const attacks = diagnostics.status === 'vulnerable' ? [{ prefix: 'attack', attack: diagnostics.attack }] : []

  if (borrowed) {
    console.log(`  borrowed:   attack string of ${borrowed.label}`)
    attacks.push({ prefix: 'borrowed attack', attack: borrowed.attack })
  }

  for (const { prefix, attack } of attacks) {
    for (const size of options.sizes) {
      runs.push({ name: `${prefix} @ ${size.toLocaleString('en-US')}`, input: buildAttackString(attack, size) })
    }
  }

  if (!runs.length) {
    console.log('  timings:    none (recheck found no attack string; pass --samples, --input or --attack-from)\n')

    return ok
  }

  const rows = []

  for (const { name, input } of runs) {
    const result = await timeRegex(target.source, target.flags, input, options.timeout)

    if ('timedOut' in result) {
      ok = false
      rows.push([name, input.length.toLocaleString('en-US'), '-', `stopped at ${options.timeout} ms`])
    } else {
      rows.push([name, input.length.toLocaleString('en-US'), result.matched ? 'yes' : 'no', `${result.ms.toFixed(3)} ms`])
    }
  }

  const header = ['input', 'chars', 'match', 'time']
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const format = (/** @type {string[]} */ row) => `  ${row.map((cell, i) => (i === 1 || i === 3 ? cell.padStart(widths[i]) : cell.padEnd(widths[i]))).join('  ')}`

  console.log('')
  console.log(format(header))
  console.log(format(widths.map((w) => '-'.repeat(w))))
  rows.forEach((row) => console.log(format(row)))
  console.log('')

  return ok
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))

  if (options.help || options.target === undefined) {
    console.log(USAGE)

    return options.help ? 0 : 2
  }

  const recheck = loadRecheck()

  if (!recheck) {
    console.error(`recheck is not installed. It stays out of the repo's dependencies, so install it once outside the repo:

  npm install --prefix "${RECHECK_DIR}" recheck@${RECHECK_VERSION}

Set CHECK_REGEX_RECHECK_DIR to use a different location.`)

    return 2
  }

  const targets = await resolveTargets(options.target, options.flags)
  const samples = await readSamples(options.samples, options.inputs)
  let borrowed = null

  if (options.attackFrom) {
    const [from] = await resolveTargets(options.attackFrom, undefined)
    const fromDiagnostics = await recheck.check(from.source, from.flags)

    if (fromDiagnostics.status !== 'vulnerable') {
      throw new Error(`--attack-from: recheck rates ${from.label} ${fromDiagnostics.status}, so it has no attack string`)
    }

    borrowed = { label: from.label, attack: fromDiagnostics.attack }
  }

  let ok = true

  for (const target of targets) {
    ok = (await checkTarget(target, recheck, samples, options, borrowed)) && ok
  }

  console.log('Timings are from this machine only. Compare them with each other, not with numbers measured elsewhere.')

  return ok ? 0 : 1
}

module.exports = { buildAttackString, findRegexesOnLine, parsePatternArg }

if (require.main === module) {
  main().then((code) => {
    process.exitCode = code
  }, (err) => {
    console.error(err.message)
    process.exitCode = 2
  })
}
