import Fixtures, { ProjectFixtureDir } from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'

export async function scaffoldSystemTestProject (project: ProjectFixtureDir) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  await FixturesScaffold.scaffoldProjectNodeModules({ project })

  return Fixtures.projectPath(project)
}
