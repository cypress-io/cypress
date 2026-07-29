#!/usr/bin/env node
/*
 * Triage helper for the V8 snapshot bundler panic:
 *
 *   panic: Expected a BIdentifier for binding value
 *     ...snap_printer.extractBinding (snap_printer_common.go)
 *     ...snap_printer.extractRequireDeclaration (snap_handle_slocal.go)
 *
 * The cypress-io/esbuild snapshot fork rewrites every `const X = require('Y')`
 * whose target Y is externalized (all Node core/builtin modules) or deferred
 * into a lazy accessor. That rewrite only understands a flat identifier on the
 * binding's property value, so a NESTED destructuring pattern panics, e.g.
 *
 *   const { inherits, types: { isDate } } = require('util')   // types: {..} nests
 *   const { Transform, promises: { pipeline } } = require('stream')
 *
 * Flat / renamed / rest / default / array-at-top-level bindings are all fine.
 *
 * This script scans node_modules for that exact shape so you can find which
 * dependency pulled it into your local snapshot graph. Fix by adding the file
 * to tooling/v8-snapshot/src/setup/force-no-rewrite.ts.
 *
 * Usage:  node scripts/find-snapshot-binding-panic.js [rootDir=node_modules]
 */
const fs = require('fs')
const path = require('path')

const CORE = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2',
  'https', 'module', 'net', 'os', 'path', 'perf_hooks', 'process',
  'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder',
  'sys', 'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads',
  'zlib', 'async_hooks', 'inspector', 'fs/promises', 'stream/promises',
  'stream/web', 'dns/promises', 'timers/promises', 'util/types',
])

const isCore = (spec) => {
  let s = spec.replace(/^['"]|['"]$/g, '')

  if (s.startsWith('node:')) s = s.slice(5)

  return CORE.has(s)
}

// `{ ... } = require('spec')`, allowing one level of nested braces in the LHS
const decl = /(?:const|let|var)\s*(\{(?:[^{}]|\{[^{}]*\})*\})\s*=\s*require\(\s*(['"][^'"]+['"])\s*\)/gs
// a property whose value is itself an object/array pattern
const nestedValue = /[A-Za-z0-9_$'"\]]\s*:\s*[{[]/

const root = process.argv[2] || 'node_modules'
const hits = []

const walk = (dir) => {
  let entries

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const e of entries) {
    const full = path.join(dir, e.name)

    if (e.isDirectory()) {
      walk(full)
    } else if (e.name.endsWith('.js')) {
      let src

      try {
        src = fs.readFileSync(full, 'utf8')
      } catch {
        continue
      }

      for (const m of src.matchAll(decl)) {
        const [, lhs, spec] = m

        if (nestedValue.test(lhs) && isCore(spec)) {
          hits.push({ file: full, spec, lhs: lhs.replace(/\s+/g, ' ').slice(0, 90) })
        }
      }
    }
  }
}

walk(root)

if (!hits.length) {
  // eslint-disable-next-line no-console
  console.log(`No nested-destructure-from-core requires found under ${root}. The panic is likely a nested destructure from a *deferred* (non-core) module instead — check tooling/v8-snapshot/cache/<platform>/snapshot-meta.json "deferred" list.`)
  process.exit(0)
}

// eslint-disable-next-line no-console
console.log(`Found ${hits.length} file(s) that will panic the snapshot bundler:\n`)
for (const h of hits) {
  // eslint-disable-next-line no-console
  console.log(`  ${h.file}\n    require(${h.spec})  <-  ${h.lhs}\n`)
}
