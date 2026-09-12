// The one place that answers "which ESLint owns this file". Both the
// pre-commit hook (lint-staged.config.js) and Claude Code's edit hook read it,
// so the two cannot disagree about a package that has migrated to flat config
// while the rest of the repo has not.
//
// CommonJS with no dependencies: lint-staged loads this before anything is
// built, and the Claude Code hook loads it without a transpile step.

const { execFileSync } = require('child_process')
const { existsSync, readFileSync } = require('fs')
const { extname, isAbsolute, join, relative, resolve } = require('path')

const LINTABLE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json']

const FLAT_CONFIG_FILES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
]

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const globToRegExp = (glob) => {
  return new RegExp(`^${glob.replace(/\./g, '\\.').replace(/\*/g, '[^/]+')}$`)
}

const describeWorkspace = (dir, root) => {
  // The root manifest is named `cypress`, which is also cli's name, so a
  // root-level file is given no workspace to run under.
  const name = dir === root ? null : readJson(join(dir, 'package.json'))?.name

  return {
    dir,
    name: name ?? null,
    isFlatConfig: FLAT_CONFIG_FILES.some((config) => existsSync(join(dir, config))),
  }
}

const isLintable = (file) => LINTABLE_EXTENSIONS.includes(extname(file))

// Asking git rather than keeping a list: .gitignore already covers every
// build output, generated type and vendored tree in the repo.
const isIgnored = (file, root) => {
  try {
    execFileSync('git', ['check-ignore', '--quiet', '--', file], { cwd: root, stdio: 'ignore' })

    return true
  } catch {
    // Exit 1 means "not ignored". A missing git, or a directory that is not a
    // repository, lands here too, where treating the file as lintable is the
    // safer default.
    return false
  }
}

// The shallowest workspace wins. Test fixtures carry their own manifests, so
// walking up to the nearest package.json would stop inside one of those and
// lint the file as if its package had never migrated.
const findWorkspace = (file, root) => {
  const rel = relative(root, isAbsolute(file) ? file : resolve(root, file))

  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    return null
  }

  const segments = rel.split(/[\\/]/)

  if (segments.length === 1) {
    return describeWorkspace(root, root)
  }

  const globs = (readJson(join(root, 'package.json'))?.workspaces?.packages ?? []).map(globToRegExp)

  for (let depth = 1; depth < segments.length; depth++) {
    const candidate = segments.slice(0, depth).join('/')

    if (globs.some((glob) => glob.test(candidate))) {
      const dir = join(root, candidate)

      return existsSync(join(dir, 'package.json')) ? describeWorkspace(dir, root) : describeWorkspace(root, root)
    }
  }

  return null
}

module.exports = { LINTABLE_EXTENSIONS, findWorkspace, isIgnored, isLintable }
