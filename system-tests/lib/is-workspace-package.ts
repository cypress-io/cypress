import path from 'path'
import fs from 'fs-extra'

export async function isWorkspacePackage (projectDir: string, projectsDir: string): Promise<boolean> {
  const lockfiles = ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb']
  let currentDir = path.dirname(projectDir)

  // Check parent directories up to but not including the projectsDir.
  while (currentDir !== projectsDir && currentDir.startsWith(projectsDir)) {
    for (const lockfile of lockfiles) {
      const lockfilePath = path.join(currentDir, lockfile)
      const hasLockfile = await fs.stat(lockfilePath).catch(() => false)

      if (hasLockfile) {
        return true
      }
    }

    currentDir = path.dirname(currentDir)
  }

  return false
}
