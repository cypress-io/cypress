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

  // it(`vuecli v4 vue 3`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-vuecli-v4-vue-3')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('vuecli4-vue3')
  // })

  // it(`vuecli v5 vue 2`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-vuecli-v5-vue-2')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('vuecli5-vue2')
  // })

  // it(`vuecli v5 vue 3`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-vuecli-v5-vue-3')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('vuecli5-vue3')
  // })

  // it(`next v11+`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-nextjs-configured')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('nextjs')
  // })

  // it(`create react app v4`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-create-react-app-js')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('create-react-app')
  // })

  // it(`vite and react`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-react-vite')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('react-vite')
  // })

  // it(`vite and vue 3`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-vue3-vite')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('vue3-vite')
  // })

  // it(`nuxt 2`, async () => {
  //   const dir = await  scaffoldMigrationProject('pristine-nuxtjs-vue2-configured')
  //   const actual = await detect(dir)
  //   expect(actual.id).to.eq('nuxt-2')
  // })
})
