/**
 * Fails when a line a change adds to Markdown links to a repo path that doesn't
 * exist, or when any Markdown file still links to a file the change deletes. Links to
 * URLs, anchors on the same page and anything inside code are not checked.
 *
 * A change is everything between the merge base with --base and the working
 * tree, untracked files included, so it covers both a pushed branch and
 * uncommitted local edits.
 *
 * Usage: node scripts/check-markdown-links.mts [--base origin/develop]
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

type Link = { line: number, target: string }

const MARKDOWN_RE = /\.mdx?$/i
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i

const git = (args: string[], cwd: string): string => {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

const lines = (output: string): string[] => output.split('\n').filter(Boolean)

// Lists the tracked Markdown files that contain any of `terms`
const grepMarkdown = (terms: string[], cwd: string): string[] => {
  try {
    return lines(git(['grep', '-l', '-F', ...terms.flatMap((term) => ['-e', term]), '--', '*.md', '*.mdx'], cwd))
  } catch (err) {
    // `git grep` exits 1 when nothing matches
    if (err instanceof Error && 'status' in err && err.status === 1) return []

    throw err
  }
}

// `see `[a](b)` and <!-- [c](d) -->` keeps only `see ` and ` and `, so
// examples in code spans and comments aren't read as links.
const stripInlineCode = (line: string): string => line.replace(/`+[^`]*`+/g, '')

const extractLinks = (markdown: string): Link[] => {
  const links: Link[] = []
  let fence: string | null = null
  let inComment = false

  markdown.split('\n').forEach((rawLine, index) => {
    const fenceMatch = rawLine.match(/^\s*(`{3,}|~{3,})/)

    if (fenceMatch) {
      if (!fence) {
        fence = fenceMatch[1]
      } else if (fenceMatch[1].startsWith(fence)) {
        fence = null
      }

      return
    }

    if (fence) return

    let line = stripInlineCode(rawLine)

    if (inComment) {
      const end = line.indexOf('-->')

      if (end === -1) return

      line = line.slice(end + 3)
      inComment = false
    }

    line = line.replace(/<!--.*?-->/g, '')

    const commentStart = line.indexOf('<!--')

    if (commentStart !== -1) {
      line = line.slice(0, commentStart)
      inComment = true
    }

    const patterns = [
      // Matches the `](target)` half only, so a badge nested in a link
      // (`[![alt](img)](href)`) yields both targets.
      /\]\(\s*<?([^)\s>]+)>?/g,
      /^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/g,
      /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi,
    ]

    for (const pattern of patterns) {
      for (const match of line.matchAll(pattern)) {
        links.push({ line: index + 1, target: match[1] })
      }
    }
  })

  return links
}

// Resolves `../assets/demo.gif#top` in `docs/guide.md` to `assets/demo.gif`,
// and `/README.md` to `README.md`, the way GitHub renders repo links. Returns
// null for anything that isn't a path in the repo.
const resolveTarget = (fromFile: string, target: string): string | null => {
  if (SCHEME_RE.test(target) || target.startsWith('//') || target.startsWith('#')) return null

  const withoutSuffix = target.replace(/[?#].*$/, '')

  if (!withoutSuffix) return null

  let decoded = withoutSuffix

  try {
    decoded = decodeURI(withoutSuffix)
  } catch {
    // A malformed escape is checked as written
  }

  const resolved = decoded.startsWith('/')
    ? path.posix.normalize(decoded.slice(1))
    : path.posix.join(path.posix.dirname(fromFile), decoded)

  return resolved.replace(/\/$/, '') || '.'
}

// `@@ -10,2 +12,3 @@` in a zero-context diff means lines 12 to 14 are new
const addedLines = (base: string, file: string, cwd: string): Set<number> => {
  const added = new Set<number>()
  const diff = git(['diff', '--no-renames', '-U0', base, '--', file], cwd)

  for (const match of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(match[1])
    const count = match[2] === undefined ? 1 : Number(match[2])

    for (let line = start; line < start + count; line++) added.add(line)
  }

  return added
}

const main = () => {
  const { values } = parseArgs({ options: { base: { type: 'string', default: 'origin/develop' } } })
  const root = git(['rev-parse', '--show-toplevel'], process.cwd()).trim()
  const mergeBase = git(['merge-base', 'HEAD', values.base], root).trim()

  const changes = lines(git(['-c', 'core.quotepath=false', 'diff', '--no-renames', '--name-status', mergeBase], root))
  .map((entry) => {
    const [status, file] = entry.split('\t')

    return { status, file }
  })
  const untracked = lines(git(['-c', 'core.quotepath=false', 'ls-files', '--others', '--exclude-standard'], root))
  const deleted = changes.filter((c) => c.status === 'D').map((c) => c.file)

  // Every path that will exist once the change lands, plus each directory
  // that holds one, so a link to a folder resolves too. Ignored files are left
  // out on purpose: a link to a local build output passes here but not on GitHub.
  const deletedSet = new Set(deleted)
  const files = [...lines(git(['-c', 'core.quotepath=false', 'ls-files'], root)), ...untracked]
  .filter((file) => !deletedSet.has(file))
  const existing = new Set<string>(['.'])

  for (const file of files) {
    existing.add(file)

    for (let dir = path.posix.dirname(file); dir !== '.'; dir = path.posix.dirname(dir)) {
      existing.add(dir)
    }
  }

  const changedMarkdown = [
    ...changes.filter((c) => c.status !== 'D').map((c) => c.file),
    ...untracked,
  ].filter((file) => MARKDOWN_RE.test(file))

  // Only links on added lines, or links to deleted files, are reported, so a
  // broken link already in the repo doesn't fail an unrelated change.
  const mentionsDeleted = deleted.length ? grepMarkdown(deleted.map((file) => path.posix.basename(file)), root) : []

  // Lines the change adds, by file. `null` means every line (a new file).
  const toCheck = new Map<string, Set<number> | null>()

  for (const file of mentionsDeleted) toCheck.set(file, new Set())

  for (const file of changedMarkdown) {
    toCheck.set(file, untracked.includes(file) ? null : addedLines(mergeBase, file, root))
  }

  const problems: string[] = []

  for (const [file, added] of toCheck) {
    const content = fs.readFileSync(path.join(root, file), 'utf8')

    for (const { line, target } of extractLinks(content)) {
      const resolved = resolveTarget(file, target)

      if (resolved === null || existing.has(resolved)) continue

      if (deletedSet.has(resolved)) {
        problems.push(`${file}:${line}  ${target}  (links to a file this change deletes)`)
      } else if (added === null || added.has(line)) {
        problems.push(`${file}:${line}  ${target}  (no such file in the repo)`)
      }
    }
  }

  if (problems.length) {
    process.stderr.write(`Found ${problems.length} broken link(s) in Markdown:\n\n${problems.map((p) => `  ${p}`).join('\n')}\n`)
    process.exit(1)
  }

  process.stdout.write(`Checked ${toCheck.size} Markdown file(s) against ${mergeBase.slice(0, 12)}: no broken repo links.\n`)
}

main()
