export const getTypescript = (typescriptPath?: string) => {
  const projectTsPath = require.resolve(typescriptPath || 'typescript', {
    paths: [process.cwd()],
  })

  const typescript = require(projectTsPath) as typeof import('typescript')

  return typescript
}

/**
 * Resolves the TypeScript package version used for ts-loader (project or explicit path).
 * @returns `null` when `typescript` cannot be resolved.
 */
export const getResolvedTypescriptVersion = (typescriptPath?: string): string | null => {
  try {
    const version = getTypescript(typescriptPath).version

    return version
  } catch {
    return null
  }
}
