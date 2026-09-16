#!/usr/bin/env node

// Checks that every workflow entry invoking a path-filtered job carries an
// expression filter matching the pipeline parameters that job's guard consults.
//
// This runs in the lint job rather than in pack-workflows, which would be
// earlier and fail closed, because pack-workflows runs on cimg/base:stable and
// that image has no Node. The late gate is tolerable: `.circleci/*` is a global
// trigger in generate-pipeline-parameters.sh, so a PR that changes this config
// runs every job all-true anyway. A bad filter can only take effect on later
// PRs, by which point this check has already blocked the config change.
//
// Once `halt-if-skipped` is removed, the guard exists only at the workflow
// entry. Nothing else stops a new entry for an already-guarded job from
// silently losing its filter and running on every PR, or — worse, via the
// "all dependencies filtered" rule — from being dropped along with its only
// upstream and reported as passed. See cypress-io/cypress#34782.

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const SRC = path.join(__dirname, '..', '.circleci', 'src', 'pipeline')
const PIPELINE = path.join(SRC, '@pipeline.yml')

// @main.yml is not filtered yet. Its jobs are path-filtered only on electron/*
// branches and force-persist-artifacts runs, where generate-pipeline-parameters.sh
// does not emit all-true. Moving it in scope is a follow-up to #34782.
const IN_SCOPE = ['pull-request.yml']
const OUT_OF_SCOPE = ['@main.yml']

const GUARD_RE = /pipeline\.parameters\.(run-[a-z0-9-]+)/g

const collectGuards = (node, found = new Set()) => {
  if (typeof node === 'string') {
    for (const m of node.matchAll(GUARD_RE)) found.add(m[1])
  } else if (Array.isArray(node)) {
    node.forEach((n) => collectGuards(n, found))
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach((n) => collectGuards(n, found))
  }

  return found
}

const guardedJobs = () => {
  const jobs = yaml.load(fs.readFileSync(PIPELINE, 'utf8')).jobs || {}
  const guarded = new Map()

  for (const [name, def] of Object.entries(jobs)) {
    const guards = collectGuards(def)

    if (guards.size) guarded.set(name, [...guards].sort())
  }

  return guarded
}

// A filter has to be at least as restrictive as the guard it replaces, so every
// parameter the guard consults must appear in the expression as `== true`. Extra
// clauses are allowed: an entry may carry its own condition on top of the guard,
// as the force-http1 entries do.
//
// A multi-parameter guard is always an `or` — the job runs if any one of its
// parameters is set. Joining those with `and` instead would filter the job out
// of runs that need it, so the operator is checked too. This is a keyword check,
// not an evaluator; it catches the mistakes that lose coverage, not every
// possible wrong expression.
const checkFilter = (filter, guards) => {
  if (filter === undefined) {
    return `missing filter; job is guarded by ${guards.join(', ')}`
  }

  if (typeof filter !== 'string') {
    return `filter is a branch/tag map, which cannot also carry an expression; guard is ${guards.join(', ')}`
  }

  const missing = guards.filter((g) => !filter.includes(`pipeline.parameters.${g} == true`))

  if (missing.length) {
    return `filter does not test ${missing.join(', ')}; job is guarded by ${guards.join(', ')}`
  }

  // Only how the guard parameters are joined *to each other* matters. An entry
  // is free to `and` its own extra condition on top, as percy-finalize does with
  // percy-enabled.
  if (guards.length > 1) {
    const at = guards
    .map((g) => ({ g, i: filter.indexOf(`pipeline.parameters.${g}`) }))
    .sort((a, b) => a.i - b.i)

    for (let n = 1; n < at.length; n++) {
      const between = filter.slice(at[n - 1].i, at[n].i)

      if (/ and /.test(between) && !/ or /.test(between)) {
        return `guard on this job is an or across ${guards.join(', ')}, but the filter joins ${at[n - 1].g} to ${at[n].g} with and`
      }
    }
  }

  return null
}

const auditFile = (file, guarded) => {
  const doc = yaml.load(fs.readFileSync(path.join(SRC, 'workflows', file), 'utf8'))
  const problems = []

  for (const entry of doc.jobs || []) {
    const [job, cfg] = Object.entries(entry)[0]
    const guards = guarded.get(job)

    if (!guards) continue

    const name = (cfg && cfg.name) || job
    const problem = checkFilter(cfg && cfg.filters, guards)

    if (problem) problems.push(`${file} → ${name}\n    ${problem}`)
  }

  return problems
}

// CircleCI drops a filtered job from downstream `requires` lists, but "if all
// dependencies of a job are filtered, that job doesn't execute either". So an
// entry whose dependencies are all conditional disappears whenever every one of
// them is filtered out — silently, with all-jobs-passed reporting green.
//
// The invariant: whenever an entry's own guard says it should run, at least one
// of its dependencies must still be scheduled. Comparing guard parameters rather
// than whole expressions keeps this a set check instead of an evaluator, and the
// guard is what decides whether the job is wanted.
const auditDependencies = (file, guarded) => {
  const doc = yaml.load(fs.readFileSync(path.join(SRC, 'workflows', file), 'utf8'))
  const entries = (doc.jobs || []).map((e) => {
    const [job, cfg] = Object.entries(e)[0]

    return { job, cfg: cfg || {}, name: (cfg && cfg.name) || job }
  })

  const byName = new Map(entries.map((e) => [e.name, e]))
  const problems = []

  for (const { job, cfg, name } of entries) {
    const guards = guarded.get(job)
    const requires = cfg.requires || []

    if (!guards || !requires.length) continue

    const deps = requires.map((r) => byName.get(r)).filter(Boolean)

    if (deps.some((d) => !guarded.has(d.job))) continue // an unconditional dep always runs

    const covered = new Set(deps.flatMap((d) => guarded.get(d.job)))
    const orphaned = guards.filter((g) => !covered.has(g))

    if (orphaned.length) {
      problems.push(`${file} → ${name}\n    runs when ${orphaned.join(', ')} is set, but every dependency (${requires.join(', ')}) is filtered out in that case\n    the job would be dropped and all-jobs-passed would still report green`)
    }
  }

  return problems
}

const main = () => {
  const guarded = guardedJobs()
  const problems = [
    ...IN_SCOPE.flatMap((f) => auditFile(f, guarded)),
    ...IN_SCOPE.flatMap((f) => auditDependencies(f, guarded)),
  ]

  if (problems.length) {
    console.error(`\n✖ ${problems.length} workflow ${problems.length === 1 ? 'entry does' : 'entries do'} not match the guard on the job they invoke:\n`)
    problems.forEach((p) => console.error(`  ${p}\n`))
    console.error(`Every entry invoking a guarded job needs an expression filter testing every\nparameter that job's guard consults. See cypress-io/cypress#34782.\n`)
    process.exit(1)
  }

  console.log(`✅ CI job filters match their guards and every guarded job keeps a live dependency (${guarded.size} guarded job definitions, scope: ${IN_SCOPE.join(', ')}; not yet in scope: ${OUT_OF_SCOPE.join(', ')})`)
}

main()
