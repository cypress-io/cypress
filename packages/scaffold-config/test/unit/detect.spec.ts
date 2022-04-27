import { expect } from 'chai'
import fs from 'fs-extra'
import type { ProjectFixtureDir } from '@tooling/system-tests'
import { detectFramework, detectLanguage } from '../../src'
import Fixtures from '@tooling/system-tests'
import path from 'path'

export async function scaffoldMigrationProject (project: ProjectFixtureDir) {
  Fixtures.removeProject(project)

  await Fixtures.scaffoldProject(project)

  return path.join(Fixtures.projectPath(project))
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
function fakeDepsInNodeModules (cwd: string, deps: Array<DepToFake | DevDepToFake>) {
  fs.mkdirSync(path.join(cwd, 'node_modules'))
  for (const dep of deps) {
    const depName = 'dependency' in dep ? dep.dependency : dep.devDependency
    const nodeModules = path.join(cwd, 'node_modules', depName)

    fs.mkdirpSync(nodeModules)
    fs.writeJsonSync(
      path.join(cwd, 'node_modules', depName, 'package.json'),
      { main: 'index.js', version: dep.version },
    )
  }
}

describe('detectFramework', () => {
  it('Create React App v4', async () => {
    const projectPath = await scaffoldMigrationProject('create-react-app-unconfigured')

    fakeDepsInNodeModules(projectPath, [{ dependency: 'react-scripts', version: '5.0.0' }])
    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('reactscripts')
  })

  it('Create React App v5', async () => {
    const projectPath = await scaffoldMigrationProject('create-react-app-unconfigured')

    fakeDepsInNodeModules(projectPath, [{ dependency: 'react-scripts', version: '4.0.0' }])
    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('reactscripts')
  })

  it('React App with webpack 5', async () => {
    const projectPath = await scaffoldMigrationProject('react-app-webpack-5-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { dependency: 'react', version: '16.0.0' },
      { devDependency: 'webpack', version: '5.0.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('react')
    expect(actual.bundler.type).to.eq('webpack')
  })

  it(`Vue CLI w/ Vue 2`, async () => {
    const projectPath = await scaffoldMigrationProject('vueclivue2-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: '@vue/cli-service', version: '4.0.0' },
      { dependency: 'vue', version: '2.5.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('vueclivue2')
    expect(actual.bundler.type).to.eq('webpack')
  })

  it(`Vue CLI 5 w/ Vue 3`, async () => {
    const projectPath = await scaffoldMigrationProject('vuecli5vue3-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: '@vue/cli-service', version: '5.0.0' },
      { dependency: 'vue', version: '3.2.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('vueclivue3')
    expect(actual.bundler.type).to.eq('webpack')
  })

  it(`Vue CLI w/ Vue 3`, async () => {
    const projectPath = await scaffoldMigrationProject('vueclivue3-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: '@vue/cli-service', version: '5.0.0' },
      { dependency: 'vue', version: '3.2.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('vueclivue3')
    expect(actual.bundler.type).to.eq('webpack')
  })

  it(`React with Vite`, async () => {
    const projectPath = await scaffoldMigrationProject('react-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '2.0.0' },
      { dependency: 'react', version: '17.0.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('react')
    expect(actual.bundler.type).to.eq('vite')
  })

  it(`React with Vite using pre-release version`, async () => {
    const projectPath = await scaffoldMigrationProject('react-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '2.5.0-alpha.4' },
      { dependency: 'react', version: '17.0.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('react')
    expect(actual.bundler.type).to.eq('vite')
  })

  it(`Vue with Vite`, async () => {
    const projectPath = await scaffoldMigrationProject('vue3-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '2.0.0' },
      { dependency: 'vue', version: '3.0.0' },
    ])

    const actual = detectFramework(projectPath)

    expect(actual.framework.type).to.eq('vue3')
    expect(actual.bundler.type).to.eq('vite')
  })

  ;['10.0.0', '11.0.0', '12.0.0'].forEach((v) => {
    it(`Next.js v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('nextjs-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: 'react', version: '18.0.0' },
        { dependency: 'next', version: v },
      ])

      const actual = detectFramework(projectPath)

      expect(actual.framework.type).to.eq('nextjs')
      expect(actual.bundler.type).to.eq('webpack')
    })
  })

  it(`no framework or library`, async () => {
    const projectPath = await scaffoldMigrationProject('pristine')

    // remove common node_modules or we will find a bunch of frameworks
    // we want to simulate someone having nothing installed, including
    // monorepo like situations where there can be multiple levels of
    // node_modules above the projectPath.
    fs.rmSync(path.join(Fixtures.cyTmpDir, 'node_modules'), { recursive: true, force: true })
    const actual = detectFramework(projectPath)

    expect(actual.framework).to.be.undefined
    expect(actual.bundler).to.be.undefined
  })
})

describe('detectLanguage', () => {
  it('existing project with `cypress.config.ts`', async () => {
    const projectRoot = await scaffoldMigrationProject('config-with-ts')
    const actual = detectLanguage(projectRoot)

    expect(actual).to.eq('ts')
  })

  it('existing project with `cypress.config.js`', async () => {
    const projectRoot = await scaffoldMigrationProject('config-with-js')
    const actual = detectLanguage(projectRoot)

    expect(actual).to.eq('js')
  })

  it('pristine project with typescript in package.json', async () => {
    const projectRoot = await scaffoldMigrationProject('pristine-yarn')
    const actual = detectLanguage(projectRoot)

    expect(actual).to.eq('ts')
  })

  it('pristine project with root level tsconfig.json', async () => {
    const projectRoot = await scaffoldMigrationProject('pristine-npm')
    const actual = detectLanguage(projectRoot)

    expect(actual).to.eq('ts')
  })

  it('pre-migration project with tsconfig.json in cypress directory', async () => {
    const projectRoot = await scaffoldMigrationProject('migration')
    const actual = detectLanguage(projectRoot)

    expect(actual).to.eq('ts')
  })
})
