import fs from 'fs'
import path from 'path'

export async function uninstallDependenciesInScaffoldedProject ({ currentProject }) {
  await fs.promises.rm(path.resolve(currentProject, '../node_modules'), { recursive: true, force: true })

  return null
}
