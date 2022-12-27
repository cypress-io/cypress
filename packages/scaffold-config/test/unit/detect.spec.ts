import Module from 'module'
import { expect } from 'chai'
import fs from 'fs-extra'
import globby from 'globby'
import type { ProjectFixtureDir } from '@tooling/system-tests'
import { detectFramework, detectLanguage, PkgJson } from '../../src'
import Fixtures from '@tooling/system-tests'
import path from 'path'

beforeEach(() => {
  // @ts-ignore
  Module._cache = Object.create(null)
  // @ts-ignore
  Module._pathCache = Object.create(null)
  require.cache = Object.create(null)
})

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

    fs.writeFileSync(
      path.join(cwd, 'node_modules', depName, 'index.js'),
      'export STUB = true',
    )
  }
}

describe('detectFramework', () => {
  it('Create React App v4', async () => {
    const projectPath = await scaffoldMigrationProject('create-react-app-unconfigured')

    fakeDepsInNodeModules(projectPath, [{ dependency: 'react-scripts', version: '5.0.0' }])
    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('reactscripts')
  })

  it('Create React App v5', async () => {
    const projectPath = await scaffoldMigrationProject('create-react-app-unconfigured')

    fakeDepsInNodeModules(projectPath, [{ dependency: 'react-scripts', version: '4.0.0' }])
    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('reactscripts')
  })

  it('React App with webpack 5', async () => {
    const projectPath = await scaffoldMigrationProject('react-app-webpack-5-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { dependency: 'react', version: '16.0.0' },
      { devDependency: 'webpack', version: '5.0.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('react')
    expect(actual.bundler?.type).to.eq('webpack')
  })

  it(`Vue CLI w/ Vue 2`, async () => {
    const projectPath = await scaffoldMigrationProject('vueclivue2-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: '@vue/cli-service', version: '4.0.0' },
      { dependency: 'vue', version: '2.5.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('vueclivue2')
    expect(actual.bundler?.type).to.eq('webpack')
  })

  it(`Vue CLI 5 w/ Vue 3`, async () => {
    const projectPath = await scaffoldMigrationProject('vuecli5vue3-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: '@vue/cli-service', version: '5.0.0' },
      { dependency: 'vue', version: '3.2.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('vueclivue3')
    expect(actual.bundler?.type).to.eq('webpack')
  })

  it(`Vue CLI w/ Vue 3`, async () => {
    const projectPath = await scaffoldMigrationProject('vueclivue3-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: '@vue/cli-service', version: '5.0.0' },
      { dependency: 'vue', version: '3.2.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('vueclivue3')
    expect(actual.bundler?.type).to.eq('webpack')
  })

  it(`React with Vite`, async () => {
    const projectPath = await scaffoldMigrationProject('react-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '2.0.0' },
      { dependency: 'react', version: '17.0.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('react')
    expect(actual.bundler?.type).to.eq('vite')
  })

  it(`React with Vite using pre-release version`, async () => {
    const projectPath = await scaffoldMigrationProject('react-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '2.5.0-alpha.4' },
      { dependency: 'react', version: '17.0.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('react')
    expect(actual.bundler?.type).to.eq('vite')
  })

  it(`Vue with Vite`, async () => {
    const projectPath = await scaffoldMigrationProject('vue3-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '2.0.0' },
      { dependency: 'vue', version: '3.0.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('vue3')
    expect(actual.bundler?.type).to.eq('vite')
  })

  ;['10.0.0', '11.0.0', '12.0.0'].forEach((v) => {
    it(`Next.js v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('nextjs-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: 'react', version: '18.0.0' },
        { dependency: 'next', version: v },
      ])

      const actual = await detectFramework(projectPath)

      expect(actual.framework?.type).to.eq('nextjs')
      expect(actual.bundler?.type).to.eq('webpack')
    })
  })

  ;['13.0.0', '14.0.0'].forEach((v) => {
    it(`Angular CLI v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('angular-cli-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: '@angular/cli', version: v },
      ])

      const actual = await detectFramework(projectPath)

      expect(actual.framework?.type).to.eq('angular')
      expect(actual.bundler?.type).to.eq('webpack')
    })
  })

  ;['2.0.0', '3.0.0'].forEach((v) => {
    it(`Svelte and Vite v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('svelte-vite-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: 'svelte', version: '3.0.0' },
        { dependency: 'vite', version: v },
      ])

      const actual = await detectFramework(projectPath)

      expect(actual.framework?.type).to.eq('svelte')
      expect(actual.bundler?.type).to.eq('vite')
    })
  })

  it(`Svelte and Webpack`, async () => {
    const projectPath = await scaffoldMigrationProject('svelte-webpack-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { dependency: 'svelte', version: '3.0.0' },
      { dependency: 'webpack', version: '5.0.0' },
    ])

    const actual = await detectFramework(projectPath)

    expect(actual.framework?.type).to.eq('svelte')
    expect(actual.bundler?.type).to.eq('webpack')
  })

  it(`no framework or library`, async () => {
    const projectPath = await scaffoldMigrationProject('pristine')

    // remove common node_modules or we will find a bunch of frameworks
    // we want to simulate someone having nothing installed, including
    // monorepo like situations where there can be multiple levels of
    // node_modules above the projectPath.
    fs.rmSync(path.join(Fixtures.cyTmpDir, 'node_modules'), { recursive: true, force: true })
    const actual = await detectFramework(projectPath)

    expect(actual.framework).to.be.undefined
    expect(actual.bundler).to.be.undefined
  })
})

describe('detectLanguage', () => {
  context('existing project', () => {
    it('with `cypress.config.ts` should return `ts`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-ts')
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    it('with `cypress.config.mts` should return `ts`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-ts')

      fs.moveSync(path.join(projectRoot, 'cypress.config.ts'), path.join(projectRoot, 'cypress.config.mts'))
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    it('with `cypress.config.js` should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('js')
    })

    it('with `cypress.config.cjs` should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')

      await fs.move(path.join(projectRoot, 'cypress.config.js'), path.join(projectRoot, 'cypress.config.cjs'))
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('js')
    })

    it('with `cypress.config.mjs` should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')

      await fs.move(path.join(projectRoot, 'cypress.config.js'), path.join(projectRoot, 'cypress.config.mjs'))
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('js')
    })

    it('with custom TS cypress config file should return `ts`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-ts')

      await fs.rm(path.join(projectRoot, 'cypress.config.ts'))

      ;['ts', 'mts'].forEach((extension) => {
        const actual = detectLanguage({ projectRoot, customConfigFile: `custom_config/cypress.config-custom.${extension}`, pkgJson: {} as PkgJson })

        expect(actual).to.eq('ts')
      })
    })

    it('existing project with custom JS cypress config file should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')

      await fs.rm(path.join(projectRoot, 'cypress.config.js'))

      ;['js', 'cjs', 'mjs'].forEach((extension) => {
        const actual = detectLanguage({ projectRoot, customConfigFile: `custom_config/cypress.config-custom.${extension}`, pkgJson: {} as PkgJson })

        expect(actual).to.eq('js')
      })
    })
  })

  context('pristine project', () => {
    it('with typescript in package.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-yarn')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])
      const pkgJson = fs.readJsonSync(path.join(projectRoot, 'package.json'))
      const actual = detectLanguage({ projectRoot, pkgJson })

      expect(actual).to.eq('ts')
    })

    it('with root level tsconfig.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-npm')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    it('detects js if typescript is not resolvable when there is a tsconfig.json', async () => {
      let projectRoot = await scaffoldMigrationProject('pristine-npm')

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('js')

      projectRoot = await scaffoldMigrationProject('pristine-npm')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      const actualTypescript = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actualTypescript).to.eq('ts')
    })

    it('ignores node_modules when checking for tsconfig.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-cjs-project')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      await fs.mkdirp(path.join(projectRoot, 'node_modules', 'some-node-module'))
      await fs.writeFile(path.join(projectRoot, 'node_modules', 'some-node-module', 'tsconfig.json'), '')
      const pkgJson = fs.readJsonSync(path.join(projectRoot, 'package.json'))

      const actual = detectLanguage({ projectRoot, pkgJson })

      expect(actual).to.eq('js')
    })
  })

  context('migration project', () => {
    it('with tsconfig.json in cypress directory', async () => {
      const projectRoot = await scaffoldMigrationProject('migration')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    const joinPosix = (...s: string[]) => path.join(...s).split(path.sep).join(path.posix.sep)

    function removeAllTsFilesExcept (projectRoot: string, filename?: string) {
      const files = globby.sync(joinPosix(projectRoot, '**/*.{ts,tsx}'), { onlyFiles: true })

      for (const f of files) {
        if (!filename) {
          fs.rmSync(f)
        } else if (!f.includes(filename)) {
          fs.rmSync(f)
        }
      }
    }

    it('with only .d.ts files', async () => {
      const projectRoot = await scaffoldMigrationProject('migration-dts-files-only')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson, isMigrating: true })

      expect(actual).to.eq('js')
    })

    it('with a TypeScript supportFile', async () => {
      const projectRoot = await scaffoldMigrationProject('migration-ts-files-only')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      removeAllTsFilesExcept(projectRoot, 'support')

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    it('with a TypeScript pluginsFile', async () => {
      const projectRoot = await scaffoldMigrationProject('migration-ts-files-only')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      removeAllTsFilesExcept(projectRoot, 'plugins')

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    it('with a TypeScript integration spec', async () => {
      const projectRoot = await scaffoldMigrationProject('migration-ts-files-only')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      // detected based on `integration/**/*.tsx
      removeAllTsFilesExcept(projectRoot, 'integration')

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })

    it('with a TypeScript commponent spec', async () => {
      const projectRoot = await scaffoldMigrationProject('migration-ts-files-only')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      // detected based on `integration/**/*.tsx
      removeAllTsFilesExcept(projectRoot, 'component')

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).to.eq('ts')
    })
  })
})
