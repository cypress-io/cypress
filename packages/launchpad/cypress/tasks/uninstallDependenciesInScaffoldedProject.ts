import fs from 'fs/promises'
import path from 'path'

export async function uninstallDependenciesInScaffoldedProject ({ currentProject }) {
  await fs.rm(path.resolve(currentProject, '../node_modules'), { recursive: true, force: true })

  return null
}
