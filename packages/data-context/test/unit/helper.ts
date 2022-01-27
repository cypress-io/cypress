import path from 'path'
import fs from 'fs-extra'
import tempDir from 'temp-dir'
import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

export function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  const tmpDir = path.join(tempDir, 'cy-projects')
  const testProject = path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects', project)
  const cwd = path.join(tmpDir, project)

  try {
    fs.rmSync(cwd, { recursive: true, force: true })
  } catch (e) {
    /* eslint-disable no-console */
    console.error(`error, could not remove ${cwd}`, e.message)
  }

  fs.copySync(testProject, cwd, { recursive: true })

  return cwd
}
