import { describe, it, beforeEach, afterEach } from 'vitest'
import Fixtures, { ProjectFixtureDir } from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import execa from 'execa'
import path from 'path'
import * as fs from 'fs-extra'

const runCommandInProject = (command: string, projectPath: string) => {
  const [ex, ...args] = command.split(' ')

  return execa(ex, args, { cwd: projectPath, stdio: 'inherit' })
}

// Since the schematic downloads a new version of cypress, the latest changes of
// @cypress/angular won't exist in the tmp project. To fix this, we replace the
// contents of the <project-path>/node_modules/cypress/angular with the latest
// contents of cli/angular
const copyAngularMount = async (projectPath: string) => {
  await fs.copy(
    path.join(__dirname, '..', '..', '..', 'cli', 'angular'),
    path.join(projectPath, 'node_modules', 'cypress', 'angular'),
  )
}

const cypressSchematicPackagePath = path.join(__dirname, '..')

const ANGULAR_PROJECTS: ProjectFixtureDir[] = ['angular-18', 'angular-19']

const timeout = 1000 * 60 * 5

describe('ng add @cypress/schematic / e2e and ct', function () {
  for (const project of ANGULAR_PROJECTS) {
    describe(project, () => {
      const projectPath: string = Fixtures.projectPath(project)

      beforeEach(async () => {
        await Fixtures.scaffoldProject(project)
        await FixturesScaffold.scaffoldProjectNodeModules({ project })
        await fs.remove(path.join(projectPath, 'cypress.config.ts'))
        await fs.remove(path.join(projectPath, 'cypress'))

        await runCommandInProject(`yarn add @cypress/schematic@file:${cypressSchematicPackagePath}`, projectPath)
      }, timeout)

      afterEach(() => {
        Fixtures.removeProject(project)
      }, timeout)

      it('should install ct files with option and no component specs', async () => {
        await runCommandInProject('yarn ng add @cypress/schematic --e2e --component', projectPath)
        await copyAngularMount(projectPath)
        await runCommandInProject('yarn ng run angular:ct --watch false --spec src/app/app.component.cy.ts', projectPath)
      }, timeout)

      it('should generate component alongside component spec', async () => {
        await runCommandInProject('yarn ng add @cypress/schematic --e2e --component', projectPath)
        await copyAngularMount(projectPath)
        await runCommandInProject('yarn ng generate c foo', projectPath)
        await runCommandInProject('yarn ng run angular:ct --watch false --spec src/app/foo/foo.component.cy.ts', projectPath)
      }, timeout)
    })
  }
})
