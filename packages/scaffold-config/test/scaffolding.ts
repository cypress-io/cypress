import type { ProjectFixtureDir } from '@tooling/system-tests'
import path from 'path'
import Fixtures from '@tooling/system-tests'
import fs from 'fs-extra'

export async function scaffoldMigrationProject (project: ProjectFixtureDir) {
  const projectPath = Fixtures.projectPath(project)

  Fixtures.clearFixtureNodeModules(project)

  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return projectPath
}

interface DepToFake {
  dependency: string
  version: string
}

interface DevDepToFake {
  devDependency: string
  version: string
}

/**
 * The way we detect dependencies is by using resolve-from (https://www.npmjs.com/package/resolve-from).
 * In these unit tests, we don't want to actually run `npm install`, since it is slow,
 * so this function fakes that the dependencies are installed by creating pretend dependency like this:
 * `node_modules/<dependency>/package.json.
 * Inside `package.json` we add the minimal:
 *
 * {
 *   "version": "5.0.0",
 *   "main": "index.js"
 * }
 *
 * We have some real e2e tests that actually run `npm install`.
 * Those are in launchpad/cypress/e2e/scaffold-component-testing.cy.ts.
 */
export function fakeDepsInNodeModules (cwd: string, deps: Array<DepToFake | DevDepToFake>) {
  fs.mkdirSync(path.join(cwd, 'node_modules'))
  for (const dep of deps) {
    const depName = 'dependency' in dep ? dep.dependency : dep.devDependency
    const nodeModules = path.join(cwd, 'node_modules', depName)

    fs.mkdirpSync(nodeModules)
    fs.writeJsonSync(
      path.join(cwd, 'node_modules', depName, 'package.json'),
      { main: 'index.js', version: dep.version },
    )

    fs.writeFileSync(
      path.join(cwd, 'node_modules', depName, 'index.js'),
      'export STUB = true',
    )
  }
}
