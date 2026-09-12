#!/usr/bin/env node

// Lints the file Claude Code just edited. The harness pipes a PostToolUse
// payload on stdin, and the linter is chosen from the path that payload names.
//
// Which ESLint owns that path is scripts/eslint-routing.js's answer to give,
// shared with lint-staged so an edit and a commit cannot disagree.
//
// Plain JS rather than TypeScript: it runs on every edit, so it must start
// without a transpile step — and without the repo's dependencies, which it
// cannot assume are installed.

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

// Loaded from the checkout that owns the file, not from next to this script:
// in a worktree those are different trees, and the tree being linted is the
// one whose workspaces and ignore rules apply.
const loadRouting = (root) => {
  try {
    return createRequire(join(root, 'package.json'))('./scripts/eslint-routing.js')
  } catch {
    return null
  }
}

const resolveEslint = (from) => {
  try {
    // Resolving the manifest rather than the bin directly: ESLint's `exports`
    // map does not expose bin/eslint.js, but always exposes package.json.
    const manifest = createRequire(join(from, 'package.json')).resolve('eslint/package.json')
    const bin = join(dirname(manifest), 'bin', 'eslint.js')

    if (!existsSync(bin)) {
      return null
    }

    return { bin, major: Number(JSON.parse(readFileSync(manifest, 'utf8')).version.split('.')[0]) }
  } catch {
    return null
  }
}

// Returning nothing declines the file. A lint hook that stops work on its own
// misconfiguration is worse than no hook, so every uncertainty ends up here.
const main = () => {
  if (process.env.SKIP_CLAUDE_LINT_HOOK) {
    return
  }

  let hook

  try {
    hook = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return
  }

  const filePath = hook?.tool_input?.file_path

  if (typeof filePath !== 'string') {
    // A tool call arrived in a shape this hook does not understand, which
    // means the payload contract moved and every edit is now going unlinted.
    // Every other exit here is silent, so this one has to say so.
    return typeof hook?.tool_name === 'string'
      ? { payload: { systemMessage: `Lint hook found no tool_input.file_path in the ${hook.tool_name} payload and is linting nothing. Check .claude/hooks/lint-file.mjs against the current hook payload shape.` } }
      : undefined
  }

  const candidates = [process.env.CLAUDE_PROJECT_DIR, hook.cwd].filter((dir) => typeof dir === 'string' && dir)
  const file = isAbsolute(filePath) ? filePath : resolve(candidates[0] ?? process.cwd(), filePath)
  // In a worktree the session's project directory and the checkout holding the
  // file are separate trees, so lint against whichever one the file is in.
  const root = candidates.find((dir) => !relative(dir, file).startsWith('..'))

  if (!root || !existsSync(join(root, 'node_modules'))) {
    return
  }

  const routing = loadRouting(root)

  if (!routing || !existsSync(file) || !routing.isLintable(file) || routing.isIgnored(file, root)) {
    return
  }

  const workspace = routing.findWorkspace(file, root)

  if (!workspace) {
    return
  }

  const cwd = workspace.isFlatConfig ? workspace.dir : root
  const eslint = resolveEslint(cwd)

  if (!eslint) {
    return
  }

  const args = [eslint.bin, '--fix']

  // Without this, every edit to an ignored file answers with a warning — but
  // ESLint 8 has no such flag and errors on it.
  if (eslint.major >= 9) {
    args.push('--no-warn-ignored')
  }

  args.push(file)

  const digest = () => createHash('sha1').update(readFileSync(file)).digest('hex')
  const before = digest()
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 90000 })

  if (result.error || result.status === null) {
    return
  }

  const rel = relative(root, file)
  const wasFixed = existsSync(file) && digest() !== before

  if (result.status === 1) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
    const fixNote = wasFixed ? ' Some problems were auto-fixed, so re-read the file before editing it again.' : ''

    return { report: `ESLint reported problems in ${rel}.${fixNote}\n\n${output}\n` }
  }

  if (result.status !== 0) {
    return { payload: { systemMessage: `Lint hook skipped ${rel}: ESLint exited with ${result.status}.` } }
  }

  if (wasFixed) {
    return {
      payload: {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `eslint --fix reformatted ${rel}. Re-read it before editing it again.`,
        },
      },
    }
  }
}

const outcome = main()

// Letting the process end on its own rather than calling process.exit(): hook
// stdio is a pipe, and exiting drops whatever has not drained yet.
if (outcome?.report) {
  process.exitCode = 2
  process.stderr.write(outcome.report)
} else if (outcome?.payload) {
  process.stdout.write(JSON.stringify(outcome.payload))
}
