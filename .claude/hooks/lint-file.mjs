#!/usr/bin/env node

// Lints the file Claude Code just edited. The harness pipes a PostToolUse
// payload on stdin, and the linter is chosen from the path that payload names.
//
// That choice is not a constant: the repo is mid-migration (see
// guides/eslint-migration.md), so a package either carries its own flat config
// and a local ESLint 9, or falls back to the root .eslintrc.js under ESLint 8.
// Reading it off the path leaves no list here to keep in sync as packages move.
//
// Plain JS rather than TypeScript: it runs on every edit, so it must start
// without a transpile step — and without the repo's dependencies, which it
// cannot assume are installed.

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'

const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.json'])
const GENERATED_DIRS = new Set(['node_modules', 'dist'])
const FLAT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
]

// How deep a workspace sits under each directory, mirroring
// `workspaces.packages` in the root package.json.
const WORKSPACE_DEPTHS = new Map([
  ['cli', 1],
  ['system-tests', 1],
  ['scripts', 1],
  ['packages', 2],
  ['npm', 2],
  ['tooling', 2],
])

// Deliberately not "nearest package.json": test fixtures carry their own
// manifests, and stopping at one of those would hide the owning package's
// flat config and lint the file as if the package had never migrated.
const findWorkspaceDir = (segments, root) => {
  const depth = WORKSPACE_DEPTHS.get(segments[0])

  if (!depth || segments.length <= depth) {
    return null
  }

  const dir = join(root, ...segments.slice(0, depth))

  return existsSync(join(dir, 'package.json')) ? dir : root
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
    return
  }

  const candidates = [process.env.CLAUDE_PROJECT_DIR, hook.cwd].filter((dir) => typeof dir === 'string' && dir)
  const file = isAbsolute(filePath) ? filePath : resolve(candidates[0] ?? process.cwd(), filePath)
  // In a worktree the session's project directory and the checkout holding the
  // file are separate trees, so lint against whichever one the file is in.
  const root = candidates.find((dir) => !relative(dir, file).startsWith('..'))

  if (!root || !existsSync(join(root, 'node_modules'))) {
    return
  }

  if (!existsSync(file) || !LINTABLE_EXTENSIONS.has(extname(file))) {
    return
  }

  const rel = relative(root, file)
  const segments = rel.split(/[\\/]/)

  if (segments.some((segment) => GENERATED_DIRS.has(segment))) {
    return
  }

  const workspaceDir = segments.length === 1 ? root : findWorkspaceDir(segments, root)

  if (!workspaceDir) {
    return
  }

  const isFlatConfig = FLAT_CONFIGS.some((config) => existsSync(join(workspaceDir, config)))
  const cwd = isFlatConfig ? workspaceDir : root
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
