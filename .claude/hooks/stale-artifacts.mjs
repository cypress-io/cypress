#!/usr/bin/env node

// Names the command that refreshes a derived artifact, at the moment the edit
// that invalidated it lands. The harness pipes a PostToolUse payload on stdin.
//
// These couplings are the ones nothing else checks. lint-staged and CI both
// prove the repo still builds, never that a committed artifact is current, so
// a stale-but-valid schema.graphql merges without a word. Anything the commit
// gate already covers — ESLint, `.circleci` validation — is deliberately absent.
//
// It runs no commands and reads no dependencies, so it works in a checkout that
// has never been installed.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const SCHEMA = 'packages/data-context/schemas/schema.graphql'

// A rule returns what went stale, or nothing. `source` is the edited file.
const RULES = [
  {
    id: 'errors-to-schema',
    check: ({ rel }) => rel === 'packages/errors/src/errors.ts' && {
      stale: SCHEMA,
      run: 'yarn workspace @packages/data-context build',
      why: 'the error keys generate ErrorTypeEnum, and the schema is committed',
    },
  },
  {
    id: 'errors-to-snapshots',
    check: ({ rel }) => rel === 'packages/errors/src/errors.ts' && {
      stale: 'packages/errors/test/__snapshots__/<ERROR_NAME>.ansi',
      run: 'yarn workspace @packages/errors test -u',
      why: 'every error has a committed .ansi snapshot',
    },
  },
  {
    id: 'nexus-to-schema',
    check: ({ rel }) => rel.startsWith('packages/data-context/graphql/') && {
      stale: SCHEMA,
      run: 'yarn workspace @packages/data-context nexus-build',
      why: 'the Nexus types generate the committed schema and src/gen/nxs.gen.ts',
    },
  },
  {
    id: 'gql-documents',
    check: ({ rel, text }) => /^packages\/(app|launchpad|frontend-shared)\/src\//.test(rel)
      && /\bgql`/.test(text)
      && {
        stale: 'packages/cypress-sessions/lib/generated/graphql.ts',
        run: 'yarn workspace @packages/data-context build:graphql',
        why: 'operation types are generated from the gql documents, and that one is committed',
      },
  },
  {
    id: 'autobarrel',
    check: ({ rel, root }) => {
      const barrel = join(dirname(rel), 'index.ts')

      if (basename(rel) === 'index.ts' || !existsSync(join(root, barrel))) {
        return null
      }

      const contents = readFileSync(join(root, barrel), 'utf8')

      if (!contents.includes('created by autobarrel')) {
        return null
      }

      const stem = basename(rel, extname(rel))

      return !contents.includes(`./${stem}'`) && {
        stale: barrel,
        run: 'yarn gulp codegen',
        why: `the barrel does not export ./${stem} yet`,
      }
    },
  },
  {
    id: 'package-added',
    check: ({ rel, root }) => {
      const added = rel.match(/^packages\/([^/]+)\/package\.json$/)
      const pathMap = join(root, 'scripts/gulp/monorepoPaths.ts')

      if (!added || !existsSync(pathMap)) {
        return null
      }

      return !readFileSync(pathMap, 'utf8').includes(added[1]) && {
        stale: 'scripts/gulp/monorepoPaths.ts',
        run: 'yarn gulp makePathMap',
        why: `${added[1]} is not in the generated path map, which is committed`,
      }
    },
  },
  {
    id: 'cypress-sessions-build',
    check: ({ rel }) => rel.startsWith('packages/cypress-sessions/lib/')
      && !rel.startsWith('packages/cypress-sessions/lib/generated/')
      && {
        stale: 'the copy Rollup bundles into the CLI',
        run: 'yarn workspace @packages/cypress-sessions build',
        why: 'the CLI consumes the compiled output, not the source',
      },
  },
  {
    id: 'adapter-build',
    check: ({ rel }) => {
      const adapter = rel.match(/^npm\/(react|vue|angular|svelte|mount-utils)\//)

      return adapter && {
        stale: `the ${adapter[1]} dist/ synced into cli/`,
        run: `yarn workspace @cypress/${adapter[1]} build`,
        why: 'testing this in the binary uses the built output',
      }
    },
  },
]

// Reminding once per session per coupling: an edit-by-edit repeat of something
// the model already read is noise, and it would rather spend the turn fixing it.
const alreadyReminded = (sessionId, ids) => {
  if (!sessionId) {
    return { seen: new Set(), remember: () => {} }
  }

  const dir = join(tmpdir(), 'cypress-stale-artifacts')
  const file = join(dir, `${sessionId.replace(/[^\w-]/g, '')}.json`)
  let seen = new Set()

  try {
    seen = new Set(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    // No state yet, or it is unreadable. Remind, at worst twice.
  }

  return {
    seen,
    remember: () => {
      try {
        mkdirSync(dir, { recursive: true })
        writeFileSync(file, JSON.stringify([...seen, ...ids]))
      } catch {
        // A reminder that repeats beats one that throws.
      }
    },
  }
}

// Asking git rather than comparing mtimes: a fresh clone writes every file at
// the same moment, so "the artifact is newer than its source" is true for the
// whole repo and the reminder would never fire where it matters most. An
// artifact with uncommitted changes has already been regenerated in this
// working tree, which is the thing actually worth knowing.
const alreadyRegenerated = (stale, root) => {
  if (!existsSync(join(root, stale))) {
    return false
  }

  try {
    return execFileSync('git', ['status', '--porcelain', '--', stale], { cwd: root, encoding: 'utf8' }).trim() !== ''
  } catch {
    // No git, or not a repository. Reminding is the safer side to fail on.
    return false
  }
}

const main = () => {
  let hook

  try {
    hook = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return
  }

  const filePath = hook?.tool_input?.file_path
  const root = process.env.CLAUDE_PROJECT_DIR || hook?.cwd

  if (typeof filePath !== 'string' || !root) {
    return
  }

  const source = resolve(root, filePath)
  const rel = relative(root, source).split('\\').join('/')

  if (rel.startsWith('..') || !existsSync(source)) {
    return
  }

  let text = ''

  try {
    text = readFileSync(source, 'utf8')
  } catch {
    // Binary or unreadable: only the content-matching rule cares.
  }

  const findings = []

  for (const rule of RULES) {
    let finding

    try {
      finding = rule.check({ rel, source, root, text })
    } catch {
      continue
    }

    if (finding && !alreadyRegenerated(finding.stale, root)) {
      findings.push({ ...finding, id: rule.id })
    }
  }

  if (!findings.length) {
    return
  }

  const { seen, remember } = alreadyReminded(hook.session_id, findings.map((finding) => finding.id))
  const fresh = findings.filter((finding) => !seen.has(finding.id))

  if (!fresh.length) {
    return
  }

  remember()

  const lines = fresh.map(({ stale, run, why }) => `- ${stale} is now stale — ${why}.\n  Regenerate with: ${run}`)

  return `Editing ${rel} invalidated output that is generated rather than written:\n${lines.join('\n')}\n\nRegenerate before relying on it, and commit any regenerated file that is tracked.`
}

const context = main()

if (context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context },
  }))
}
