import { vi, describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs-extra'
import Fixtures from '@tooling/system-tests'
import { detectFramework, detectLanguage, PkgJson, CT_FRAMEWORKS, resolveComponentFrameworkDefinition, WIZARD_DEPENDENCY_WEBPACK } from '../src'
import path from 'path'
import solidJs, { solidDep } from './fixtures'
import { fakeDepsInNodeModules, scaffoldMigrationProject } from './scaffolding'

const resolvedCtFrameworks = CT_FRAMEWORKS.map((x) => resolveComponentFrameworkDefinition(x))

describe('detectFramework', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('React App with webpack 5', async () => {
    const projectPath = await scaffoldMigrationProject('react18-webpack-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { dependency: 'react', version: '18.0.0' },
      { devDependency: 'webpack', version: '5.0.0' },
    ])

    const actual = await detectFramework(projectPath, resolvedCtFrameworks)

    expect(actual.framework?.type).toEqual('react')
    expect(actual.bundler).toEqual('webpack')
  })

  it(`Webpack with Vue 3`, async () => {
    const projectPath = await scaffoldMigrationProject('vue3-webpack-ts-configured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'webpack', version: '5.0.0' },
      { dependency: 'vue', version: '3.2.0' },
    ])

    const actual = await detectFramework(projectPath, resolvedCtFrameworks)

    expect(actual.framework?.type).toEqual('vue3')
    expect(actual.bundler).toEqual('webpack')
  })

  it(`React with Vite`, async () => {
    const projectPath = await scaffoldMigrationProject('react-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '5.0.0' },
      { dependency: 'react', version: '18.0.0' },
    ])

    const actual = await detectFramework(projectPath, resolvedCtFrameworks)

    expect(actual.framework?.type).toEqual('react')
    expect(actual.bundler).toEqual('vite')
  })

  it(`Vue with Vite`, async () => {
    const projectPath = await scaffoldMigrationProject('vue3-vite-ts-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { devDependency: 'vite', version: '5.0.0' },
      { dependency: 'vue', version: '3.0.0' },
    ])

    const actual = await detectFramework(projectPath, resolvedCtFrameworks)

    expect(actual.framework?.type).toEqual('vue3')
    expect(actual.bundler).toEqual('vite')
  })

  ;['14.0.0', '15.0.4'].forEach((v) => {
    it(`Next.js v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('nextjs-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: 'react', version: v === '15.0.0' ? '19.0.0' : '18.0.0' },
        { dependency: 'next', version: v },
      ])

      const actual = await detectFramework(projectPath, resolvedCtFrameworks)

      expect(actual.framework?.type).toEqual('nextjs')
      expect(actual.bundler).toEqual('webpack')
    })
  })

  ;['18.2.0', '19.2.9'].forEach((v) => {
    it(`Angular CLI v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('angular-cli-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: '@angular/cli', version: v },
      ])

      const actual = await detectFramework(projectPath, resolvedCtFrameworks)

      expect(actual.framework?.type).toEqual('angular')
      expect(actual.bundler).toEqual('webpack')
    })
  })

  ;['5.0.0', '6.0.0'].forEach((v) => {
    it(`Svelte and Vite v${v}`, async () => {
      const projectPath = await scaffoldMigrationProject('svelte-vite-unconfigured')

      fakeDepsInNodeModules(projectPath, [
        { dependency: 'svelte', version: '5.0.0' },
        { dependency: 'vite', version: v },
      ])

      const actual = await detectFramework(projectPath, resolvedCtFrameworks)

      expect(actual.framework?.type).toEqual('svelte')
      expect(actual.bundler).toEqual('vite')
    })
  })

  it(`Svelte and Webpack`, async () => {
    const projectPath = await scaffoldMigrationProject('svelte-webpack-unconfigured')

    fakeDepsInNodeModules(projectPath, [
      { dependency: 'svelte', version: '5.0.0' },
      { dependency: 'webpack', version: '5.0.0' },
    ])

    const actual = await detectFramework(projectPath, resolvedCtFrameworks)

    expect(actual.framework?.type).toEqual('svelte')
    expect(actual.bundler).toEqual('webpack')
  })

  it(`no framework or library`, async () => {
    const projectPath = await scaffoldMigrationProject('pristine')

    // remove common node_modules or we will find a bunch of frameworks
    // we want to simulate someone having nothing installed, including
    // monorepo like situations where there can be multiple levels of
    // node_modules above the projectPath.
    fs.rmSync(path.join(Fixtures.cyTmpDir, 'node_modules'), { recursive: true, force: true })
    const actual = await detectFramework(projectPath, resolvedCtFrameworks)

    expect(actual.framework).toBeUndefined()
    expect(actual.bundler).toBeUndefined()
  })
})

describe('detectLanguage', () => {
  describe('existing project', () => {
    it('with `cypress.config.ts` should return `ts`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-ts')
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('ts')
    })

    it('with `cypress.config.mts` should return `ts`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-ts')

      fs.moveSync(path.join(projectRoot, 'cypress.config.ts'), path.join(projectRoot, 'cypress.config.mts'))
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('ts')
    })

    it('with `cypress.config.js` should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('js')
    })

    it('with `cypress.config.cjs` should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')

      await fs.move(path.join(projectRoot, 'cypress.config.js'), path.join(projectRoot, 'cypress.config.cjs'))
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('js')
    })

    it('with `cypress.config.mjs` should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')

      await fs.move(path.join(projectRoot, 'cypress.config.js'), path.join(projectRoot, 'cypress.config.mjs'))
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('js')
    })

    it('with custom TS cypress config file should return `ts`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-ts')

      await fs.rm(path.join(projectRoot, 'cypress.config.ts'))

      ;['ts', 'mts'].forEach((extension) => {
        const actual = detectLanguage({ projectRoot, customConfigFile: `custom_config/cypress.config-custom.${extension}`, pkgJson: {} as PkgJson })

        expect(actual).toEqual('ts')
      })
    })

    it('existing project with custom JS cypress config file should return `js`', async () => {
      const projectRoot = await scaffoldMigrationProject('config-with-js')

      await fs.rm(path.join(projectRoot, 'cypress.config.js'))

      ;['js', 'cjs', 'mjs'].forEach((extension) => {
        const actual = detectLanguage({ projectRoot, customConfigFile: `custom_config/cypress.config-custom.${extension}`, pkgJson: {} as PkgJson })

        expect(actual).toEqual('js')
      })
    })

    it('with tsconfig.json in cypress directory', async () => {
      const projectRoot = await scaffoldMigrationProject('ts-proj-tsconfig-in-cypress')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '5.8.3' }])
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('ts')
    })

    it('with only .d.ts files', async () => {
      const projectRoot = await scaffoldMigrationProject('dts-files-only')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '5.8.3' }])

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('js')
    })
  })

  describe('pristine project', () => {
    it('with typescript in package.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-yarn')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])
      const pkgJson = fs.readJsonSync(path.join(projectRoot, 'package.json'))
      const actual = detectLanguage({ projectRoot, pkgJson })

      expect(actual).toEqual('ts')
    })

    it('with root level tsconfig.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-npm')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])
      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('ts')
    })

    it('detects js if typescript is not resolvable when there is a tsconfig.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-npm')

      const actual = detectLanguage({ projectRoot, pkgJson: {} as PkgJson })

      expect(actual).toEqual('js')

      const projectRoot2 = await scaffoldMigrationProject('pristine-npm')

      fakeDepsInNodeModules(projectRoot2, [{ devDependency: 'typescript', version: '4.3.6' }])

      const actualTypescript = detectLanguage({ projectRoot: projectRoot2, pkgJson: {} as PkgJson })

      expect(actualTypescript).toEqual('ts')
    })

    it('ignores node_modules when checking for tsconfig.json', async () => {
      const projectRoot = await scaffoldMigrationProject('pristine-cjs-project')

      fakeDepsInNodeModules(projectRoot, [{ devDependency: 'typescript', version: '4.3.6' }])

      await fs.mkdirp(path.join(projectRoot, 'node_modules', 'some-node-module'))
      await fs.writeFile(path.join(projectRoot, 'node_modules', 'some-node-module', 'tsconfig.json'), '')
      const pkgJson = fs.readJsonSync(path.join(projectRoot, 'package.json'))

      const actual = detectLanguage({ projectRoot, pkgJson })

      expect(actual).toEqual('js')
    })
  })
})

describe('resolveComponentFrameworkDefinition', () => {
  it('resolves a first party framework', async () => {
    const projectRoot = await scaffoldMigrationProject('ts-proj-ts-files-only')

    fakeDepsInNodeModules(projectRoot, [
      { dependency: 'solid-js', version: '1.0.0' },
      { dependency: 'webpack', version: '5.0.0' },
    ])

    const result = resolveComponentFrameworkDefinition(solidJs)

    expect(await result.dependencies('webpack', projectRoot)).to.deep.include.members([
      {
        dependency: solidDep,
        detectedVersion: '1.0.0',
        satisfied: true,
      },
      {
        dependency: WIZARD_DEPENDENCY_WEBPACK,
        detectedVersion: '5.0.0',
        satisfied: true,
      },
    ])
  })
})
