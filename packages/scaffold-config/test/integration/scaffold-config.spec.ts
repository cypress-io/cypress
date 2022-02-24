import { expect } from 'chai'
import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import { detect } from '../../src/configFiles'
import Fixtures from '@tooling/system-tests/lib/fixtures'
import path from 'path'
import fs from 'fs-extra'

export async function scaffoldMigrationProject (project: typeof e2eProjectDirs[number]) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return fs.readJSON(path.join(Fixtures.projectPath(project), 'package.json'))
}

describe('detect', () => {
  it('Create React App', async () => {
    const pkg = await scaffoldMigrationProject('create-react-app-unconfigured')
    const actual = detect(pkg)

    expect(actual.type).to.eq('cra')
  })

  it(`Vue CLI w/ Vue 2`, async () => {
    const pkg = await scaffoldMigrationProject('vueclivue2-unconfigured')
    const actual = detect(pkg)

    expect(actual.type).to.eq('vueclivue2')
  })

  it(`Vue CLI w/ Vue 3`, async () => {
    const pkg = await scaffoldMigrationProject('vueclivue3-unconfigured')
    const actual = detect(pkg)

    expect(actual.type).to.eq('vueclivue3')
  })
})
