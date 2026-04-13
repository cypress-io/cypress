const { readFileSync, writeFileSync, existsSync, readdirSync, statSync } = require('fs')
const { join } = require('path')

/** Discover all yarn.lock files in the repo root and immediate workspace subdirectories. */
function discoverLockfiles(repoRoot) {
  const lockfiles = []
  const rootLock = join(repoRoot, 'yarn.lock')
  if (existsSync(rootLock)) lockfiles.push(rootLock)

  for (const entry of readdirSync(repoRoot)) {
    const dir = join(repoRoot, entry)
    if (statSync(dir).isDirectory() && existsSync(join(dir, 'package.json'))) {
      const lock = join(dir, 'yarn.lock')
      if (existsSync(lock)) lockfiles.push(lock)
    }
  }
  return lockfiles
}

/**
 * Check if a lockfile key line refers to a specific package.
 * Handles quoted/unquoted keys and merged ranges like "pkg@^1.0.0, pkg@^2.0.0".
 */
function isStanzaForPackage(keyLine, packageName) {
  const cleaned = keyLine.replace(/^"?/, '').replace(/"?:\s*$/, '')
  const parts = cleaned.split(', ')
  return parts.some((part) => {
    let name
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

/** Find all stanzas for a given package name in a lockfile. */
function findStanzasForPackage(lockfileContent, packageName) {
  const lines = lockfileContent.split('\n')
  const results = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.startsWith('#') || line.startsWith(' ') || line.startsWith('\t')) continue
    if (!isStanzaForPackage(line, packageName)) continue

    let resolvedVersion = ''
    let j = i + 1
    while (j < lines.length) {
      if (lines[j] === '') {
        j++
        break
      }
      if (!lines[j].startsWith(' ') && !lines[j].startsWith('\t')) break
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
 * Returns the modified content and list of removed stanza keys.
 */
function removeStanzasByPackageVersion(lockfileContent, removals) {
  const lines = lockfileContent.split('\n')
  const linesToRemove = new Set()
  const removedKeys = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.startsWith('#') || line.startsWith(' ') || line.startsWith('\t')) continue

    for (const { packageName, version } of removals) {
      if (!isStanzaForPackage(line, packageName)) continue

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

/** Read a lockfile, remove specified stanzas, and write it back. */
function removeLockfileStanzas(lockfilePath, removals) {
  const content = readFileSync(lockfilePath, 'utf8')
  const result = removeStanzasByPackageVersion(content, removals)
  if (result.removed.length > 0) {
    writeFileSync(lockfilePath, result.content)
  }
  return { removed: result.removed }
}

module.exports = {
  discoverLockfiles,
  isStanzaForPackage,
  findStanzasForPackage,
  removeStanzasByPackageVersion,
  removeLockfileStanzas,
}
