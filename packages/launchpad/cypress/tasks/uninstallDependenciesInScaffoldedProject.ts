import fs from 'fs'
import path from 'path'

export async function uninstallDependenciesInScaffoldedProject ({ currentProject }) {
  fs.rmdirSync(path.resolve(currentProject, '../node_modules'), { recursive: true, force: true })

  return null
}
