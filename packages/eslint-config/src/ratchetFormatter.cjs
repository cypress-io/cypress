// ESLint formatter for the CI code-quality ratchet. It prints the same output
// as `stylish` and, as a side effect, writes the finding count per rule to
// eslint-findings.json in the directory ESLint ran from, so the one lint run
// both reports to the developer and feeds the comparison with develop.
//
// This is CommonJS rather than TypeScript because ESLint loads a formatter
// module itself, and the packages still on ESLint 8 `require` it.

const fs = require('fs/promises')
const path = require('path')
const process = require('process')
const { ESLint } = require('eslint')

module.exports = async (results, data) => {
  const counts = {}

  for (const { messages } of results) {
    for (const { ruleId } of messages) {
      const rule = ruleId ?? 'parse-error'

      counts[rule] = (counts[rule] ?? 0) + 1
    }
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  await fs.writeFile(path.join(process.cwd(), 'eslint-findings.json'), `${JSON.stringify({ total, counts }, null, 2)}\n`)

  const stylish = await new ESLint().loadFormatter('stylish')

  return stylish.format(results, data)
}
