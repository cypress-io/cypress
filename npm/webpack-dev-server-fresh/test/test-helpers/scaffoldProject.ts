import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import Fixtures from '@tooling/system-tests/lib/fixtures'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'

export async function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  await FixturesScaffold.scaffoldProjectNodeModules(project)

  return Fixtures.projectPath(project)
}
