'use strict'

// Bench D — characterizes the inlined-payload bloat (#908): the full
// gherkinDocument + pickles + source are JSON.stringify'd into every compiled
// feature module, then serialized again to the browser/Cloud. Reports total
// generated-module size and how it scales with scenarios per feature.

const fs = require('node:fs')
const { template } = require('../lib/preproc')
const { makeConfig } = require('../lib/makeConfig')

async function run (root, featurePaths) {
  const cfg = makeConfig(root, { tracking: false })
  let total = 0
  let max = 0
  for (const feature of featurePaths) {
    const data = fs.readFileSync(feature, 'utf8')
    const out = await template.compile(cfg, data, feature)
    const bytes = Buffer.byteLength(out)
    total += bytes
    if (bytes > max) max = bytes
  }
  return { total, max, avg: total / featurePaths.length, count: featurePaths.length }
}

module.exports = { run }
