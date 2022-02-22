import { expect } from 'chai'
import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import { detect } from '../../src/configFiles'
import Fixtures from '@tooling/system-tests/lib/fixtures'

export async function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return Fixtures.projectPath(project)
}

describe('detect', () => {
  it(`Vue CLI w/ Vue 2`, async () => {
    const dir = await scaffoldMigrationProject('vueclivue2-unconfigured')
    const actual = detect(dir)

    expect(actual.type).to.eq('vueclivue2')
  })

  it('Create React App', async () => {
    const dir = await scaffoldMigrationProject('create-react-app-unconfigured')
    const actual = detect(dir)

    expect(actual.type).to.eq('cra')
  })
})
