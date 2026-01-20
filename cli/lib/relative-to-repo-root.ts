import path from 'path'
import fs from 'fs'
import { cwd } from 'process'

export function relativeToRepoRoot (targetPath: string): string | undefined {
  let currentDir = __dirname

  // Walk up the directory tree
  while (currentDir !== path.dirname(currentDir)) {
    const resolvedTargetPath = path.join(currentDir, targetPath)
    const rootPackageJson = path.join(currentDir, 'package.json')

    // Check if this is the root package.json with workspaces
    if (fs.existsSync(rootPackageJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'))
        const targetPathExists = fs.existsSync(resolvedTargetPath)

        if (targetPathExists && pkg.workspaces) {
          return path.resolve(currentDir, targetPath)
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    currentDir = path.dirname(currentDir)
  }

  return undefined
}
