import { describe, it } from 'vitest'
import Fixtures, { ProjectFixtureDir } from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import path from 'path'
import * as fs from 'fs-extra'
import { runCommandInProject } from './test-helpers/runCommandInProject'

const scaffoldAngularProject = async (project: string) => {
  const projectPath = Fixtures.projectPath(project)

  Fixtures.removeProject(project)
  await Fixtures.scaffoldProject(project)
  await FixturesScaffold.scaffoldProjectNodeModules({ project })
  await fs.remove(path.join(projectPath, 'cypress.config.ts'))
  await fs.remove(path.join(projectPath, 'cypress'))

  return projectPath
}

const cypressSchematicPackagePath = path.join(__dirname, '..')

const ANGULAR_PROJECTS: ProjectFixtureDir[] = ['angular-20', 'angular-21', 'angular-22']

const isZonelessAngularProject = (project: ProjectFixtureDir) => {
  return project === 'angular-21' || project === 'angular-22'
}

const needsIgnoreEngines = (project: ProjectFixtureDir) => {
  return project === 'angular-22'
}

describe('ng add @cypress/schematic / only e2e', { timeout: 1000 * 60 * 5 }, function () {
  for (const project of ANGULAR_PROJECTS) {
    it('should install e2e files by default', async () => {
      const projectPath = await scaffoldAngularProject(project)

      await runCommandInProject(
        `yarn add @cypress/schematic@file:${cypressSchematicPackagePath}`,
        projectPath,
        { ignoreEngines: needsIgnoreEngines(project) },
      )

      if (isZonelessAngularProject(project)) {
        // for angular 21, we have component testing files inside the source directory, so we need the component flag to set up the support file to declare the mount function
        await runCommandInProject(
          'yarn ng add @cypress/schematic --e2e --component --add-ct-specs false',
          projectPath,
          { ignoreEngines: needsIgnoreEngines(project) },
        )
      } else {
        await runCommandInProject(
          'yarn ng add @cypress/schematic --e2e --component false --add-ct-specs false',
          projectPath,
          { ignoreEngines: needsIgnoreEngines(project) },
        )
      }

      await runCommandInProject(
        'yarn ng e2e --watch false',
        projectPath,
        { ignoreEngines: needsIgnoreEngines(project) },
      )
    })
  }
})
