import { describe, it } from 'vitest'
import Fixtures, { ProjectFixtureDir } from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import execa from 'execa'
import path from 'path'
import * as fs from 'fs-extra'

const scaffoldAngularProject = async (project: string) => {
  const projectPath = Fixtures.projectPath(project)

  Fixtures.removeProject(project)
  await Fixtures.scaffoldProject(project)
  await FixturesScaffold.scaffoldProjectNodeModules({ project })
  await fs.remove(path.join(projectPath, 'cypress.config.ts'))
  await fs.remove(path.join(projectPath, 'cypress'))

  return projectPath
}

const runCommandInProject = (command: string, projectPath: string) => {
  const [ex, ...args] = command.split(' ')

  return execa(ex, args, { cwd: projectPath, stdio: 'inherit' })
}

const cypressSchematicPackagePath = path.join(__dirname, '..')

const ANGULAR_PROJECTS: ProjectFixtureDir[] = ['angular-18', 'angular-19']

describe('ng add @cypress/schematic / only e2e', { timeout: 1000 * 60 * 5 }, function () {
  for (const project of ANGULAR_PROJECTS) {
    it('should install e2e files by default', async () => {
      const projectPath = await scaffoldAngularProject(project)

      await runCommandInProject(`yarn add @cypress/schematic@file:${cypressSchematicPackagePath}`, projectPath)
      await runCommandInProject('yarn ng add @cypress/schematic --e2e --component false --add-ct-specs false', projectPath)
      await runCommandInProject('yarn ng e2e --watch false', projectPath)
    })
  }
})
