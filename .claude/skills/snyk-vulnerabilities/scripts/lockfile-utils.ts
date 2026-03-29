import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

/**
 * Discover all yarn.lock files in the repo root and immediate workspace subdirectories.
 */
export function discoverLockfiles(repoRoot: string): string[] {
  const lockfiles: string[] = []
  const rootLock = join(repoRoot, 'yarn.lock')
  if (existsSync(rootLock)) lockfiles.push(rootLock)

  for (const entry of readdirSync(repoRoot)) {
    const dir = join(repoRoot, entry)
    if (
      statSync(dir).isDirectory() &&
      existsSync(join(dir, 'package.json'))
    ) {
      const lock = join(dir, 'yarn.lock')
      if (existsSync(lock)) lockfiles.push(lock)
    }
  }
  return lockfiles
}

export type LockfileStanza = {
  keyLine: string
  resolvedVersion: string
  startLine: number // 0-indexed
  endLine: number // 0-indexed, exclusive (line after stanza including trailing blank)
}

/**
 * Check if a lockfile key line refers to a specific package.
 * Handles quoted/unquoted keys and merged ranges like "pkg@^1.0.0, pkg@^2.0.0":
 */
export function isStanzaForPackage(
  keyLine: string,
  packageName: string
): boolean {
  // Remove leading/trailing quotes and the trailing colon
  const cleaned = keyLine.replace(/^"?/, '').replace(/"?:\s*$/, '')
  const parts = cleaned.split(', ')
  return parts.some((part) => {
    // Handle scoped packages: @scope/name@version
    let name: string
    if (part.startsWith('@')) {
      const secondAt = part.indexOf('@', 1)
      if (secondAt === -1) return false
      name = part.substring(0, secondAt)
    } else {
      const atIdx = part.indexOf('@')
      if (atIdx === -1) return false
      name = part.substring(0, atIdx)
    }
    return name === packageName
  })
}

/**
 * Find all stanzas for a given package name in a lockfile.
 */
export function findStanzasForPackage(
  lockfileContent: string,
  packageName: string
): LockfileStanza[] {
  const lines = lockfileContent.split('\n')
  const results: LockfileStanza[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip blank lines, comments, and indented lines
    if (
      !line ||
      line.startsWith('#') ||
      line.startsWith(' ') ||
      line.startsWith('\t')
    ) {
      continue
    }

    if (!isStanzaForPackage(line, packageName)) continue

    // Find end of stanza and extract version
    let resolvedVersion = ''
    let j = i + 1
    while (j < lines.length) {
      if (lines[j] === '') {
        j++ // include trailing blank line
        break
      }
      if (!lines[j].startsWith(' ') && !lines[j].startsWith('\t')) {
        break // next stanza key (no blank separator)
      }
      const vm = lines[j].match(/^\s+version\s+"([^"]+)"/)
      if (vm) resolvedVersion = vm[1]
      j++
    }

    results.push({ keyLine: line, resolvedVersion, startLine: i, endLine: j })
  }

  return results
}

/**
 * Remove stanzas from a lockfile by package name + version.
 * Returns the modified content and count of stanzas removed.
 */
export function removeStanzasByPackageVersion(
  lockfileContent: string,
  removals: { packageName: string; version: string }[]
): { content: string; removed: string[] } {
  const lines = lockfileContent.split('\n')
  const linesToRemove = new Set<number>()
  const removedKeys: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (
      !line ||
      line.startsWith('#') ||
      line.startsWith(' ') ||
      line.startsWith('\t')
    ) {
      continue
    }

    // Check each removal target
    for (const { packageName, version } of removals) {
      if (!isStanzaForPackage(line, packageName)) continue

      // Check resolved version
      let resolvedVersion = ''
      let endJ = i + 1
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j] === '') {
          endJ = j + 1
          break
        }
        if (!lines[j].startsWith(' ') && !lines[j].startsWith('\t')) {
          endJ = j
          break
        }
        const vm = lines[j].match(/^\s+version\s+"([^"]+)"/)
        if (vm) resolvedVersion = vm[1]
        endJ = j + 1
      }

      if (resolvedVersion === version) {
        for (let k = i; k < endJ; k++) linesToRemove.add(k)
        removedKeys.push(line)
      }
    }
  }

  const newLines = lines.filter((_, idx) => !linesToRemove.has(idx))
  return { content: newLines.join('\n'), removed: removedKeys }
}

/**
 * Read a lockfile, remove specified stanzas, and write it back.
 */
export function removeLockfileStanzas(
  lockfilePath: string,
  removals: { packageName: string; version: string }[]
): { removed: string[] } {
  const content = readFileSync(lockfilePath, 'utf8')
  const result = removeStanzasByPackageVersion(content, removals)
  if (result.removed.length > 0) {
    writeFileSync(lockfilePath, result.content)
  }
  return { removed: result.removed }
}
