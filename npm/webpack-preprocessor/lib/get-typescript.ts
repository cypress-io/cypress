export const getTypescript = (typescriptPath?: string) => {
  const projectTsPath = require.resolve(typescriptPath || 'typescript', {
    paths: [process.cwd()],
  })

  const typescript = require(projectTsPath) as typeof import('typescript')

  return typescript
}
