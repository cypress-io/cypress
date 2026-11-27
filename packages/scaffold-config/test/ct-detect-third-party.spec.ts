import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scaffoldMigrationProject, fakeDepsInNodeModules } from './scaffolding'
import fs from 'fs-extra'
import path from 'path'
import { detectThirdPartyCTFrameworks, validateThirdPartyModule, isThirdPartyDefinition, isRepositoryRoot } from '../src'
import os from 'os'
import solidJs from './fixtures'

async function copyNodeModule (root, moduleName) {
  const nodeModulePath = path.join(root, 'node_modules', moduleName)

  await fs.remove(nodeModulePath)
  await fs.copy(path.join(root, moduleName), nodeModulePath)
}

async function scaffoldQwikApp (thirdPartyModuleNames: Array<'cypress-ct-qwik' | '@org/cypress-ct-qwik' | 'misconfigured-cypress-ct-qwik'>) {
  const projectRoot = await scaffoldMigrationProject('qwik-app')

  fakeDepsInNodeModules(projectRoot, [{ dependency: '@builder.io/qwik', version: '0.17.5' }])
  for (const thirdPartyModuleName of thirdPartyModuleNames) {
    await copyNodeModule(projectRoot, thirdPartyModuleName)
  }

  return projectRoot
}

describe('isThirdPartyDefinition', () => {
  describe('global package', () => {
    it('returns false for invalid prefix', () => {
      const res = isThirdPartyDefinition({ ...solidJs, type: 'non-cypress-ct' })

      expect(res).toBe(false)
    })

    it('returns true for valid prefix', () => {
      const res = isThirdPartyDefinition({ ...solidJs, type: 'cypress-ct-solid-js' })

      expect(res).toBe(true)
    })
  })

  describe('namespaced package', () => {
    it('returns false for non third party with namespace', () => {
      const res = isThirdPartyDefinition({ ...solidJs, type: '@org/non-cypress-ct' })

      expect(res).toBe(false)
    })

    it('returns true for third party with namespace', () => {
      const res = isThirdPartyDefinition({ ...solidJs, type: '@org/cypress-ct-solid-js' })

      expect(res).toBe(true)
    })
  })
})

describe('isRepositoryRoot', () => {
  const TEMP_DIR = path.join(os.tmpdir(), 'is-repository-root-tmp')

  beforeEach(async () => {
    await fs.mkdir(TEMP_DIR)
  })

  afterEach(async () => {
    await fs.rm(TEMP_DIR, { recursive: true })
  })

  it('returns false if there is nothing in the directory', async () => {
    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).toBe(false)
  })

  it('returns true if there is a Git directory', async () => {
    await fs.mkdir(path.join(TEMP_DIR, '.git'))

    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).toBe(true)
  })

  it('returns false if there is a package.json without workspaces field', async () => {
    await fs.writeFile(path.join(TEMP_DIR, 'package.json'), `{
      "name": "@packages/foo",
      "private": true,
      "version": "1.0.0",
      "main": "index.js",
      "license": "MIT"
    }
    `)

    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).toBe(false)
  })

  it('returns true if there is a package.json with workspaces field', async () => {
    await fs.writeFile(path.join(TEMP_DIR, 'package.json'), `{
        "name": "monorepo-repo",
        "private": true,
        "version": "1.0.0",
        "main": "index.js",
        "license": "MIT",
        "workspaces": [
          "packages/*"
        ]
      }
    `)

    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).toBe(true)
  })
})

describe('detectThirdPartyCTFrameworks', () => {
  it('detects third party frameworks in global namespace', async () => {
    const projectRoot = await scaffoldQwikApp(['cypress-ct-qwik'])

    const thirdPartyFrameworks = await detectThirdPartyCTFrameworks(projectRoot)

    expect(thirdPartyFrameworks.frameworks[0].type).toEqual('cypress-ct-qwik')
  })

  it('detects third party frameworks in org namespace', async () => {
    const projectRoot = await scaffoldQwikApp(['@org/cypress-ct-qwik'])

    const thirdPartyFrameworks = await detectThirdPartyCTFrameworks(projectRoot)

    expect(thirdPartyFrameworks.frameworks[0].type).toEqual('@org/cypress-ct-qwik')
  })

  it('ignores misconfigured third party frameworks', async () => {
    const projectRoot = await scaffoldQwikApp(['cypress-ct-qwik', 'misconfigured-cypress-ct-qwik'])

    const thirdPartyFrameworks = await detectThirdPartyCTFrameworks(projectRoot)

    expect(thirdPartyFrameworks.frameworks.length).toEqual(1)
    expect(thirdPartyFrameworks.frameworks[0].type).toEqual('cypress-ct-qwik')
  })

  it('detects third party frameworks in monorepos with hoisted dependencies', async () => {
    const repositoryRoot = await scaffoldMigrationProject('ct-monorepo-unconfigured')

    // Copy 'cypress-ct-qwik' third-party module into node_modules in the monorepo root
    await copyNodeModule(repositoryRoot, 'cypress-ct-qwik')

    const projectRoot = path.join(repositoryRoot, 'packages', 'foo')

    // Look for third-party modules in packages/foo (where Cypress was launched from)
    const thirdPartyFrameworks = await detectThirdPartyCTFrameworks(projectRoot)

    expect(thirdPartyFrameworks.frameworks[0].type).toEqual('cypress-ct-qwik')
  })

  describe('repository root boundary', () => {
    const TEMP_DIR = path.join(os.tmpdir(), 'ct-detect-third-party-boundary-tmp')
    const repositoryRoot = path.join(TEMP_DIR, 'repo')
    const projectRoot = path.join(repositoryRoot, 'packages', 'foo')

    beforeEach(async () => {
      const scaffolded = await scaffoldMigrationProject('ct-monorepo-unconfigured')

      await fs.mkdirp(projectRoot)
      await fs.writeJson(path.join(repositoryRoot, 'package.json'), {
        name: 'boundary-repo',
        private: true,
        workspaces: ['packages/*'],
      })

      await fs.writeJson(path.join(projectRoot, 'package.json'), { name: 'foo' })

      // The only copy of the module sits one directory above the repository root,
      // where `require.resolve` from the project can still reach it
      await fs.copy(
        path.join(scaffolded, 'cypress-ct-qwik'),
        path.join(TEMP_DIR, 'node_modules', 'cypress-ct-qwik'),
      )
    })

    afterEach(async () => {
      await fs.rm(TEMP_DIR, { recursive: true, force: true })
    })

    it('ignores third party frameworks installed above the repository root', async () => {
      const { frameworks, erroredFrameworks } = await detectThirdPartyCTFrameworks(projectRoot)

      expect(frameworks).toEqual([])
      expect(erroredFrameworks).toEqual([])
    })
  })

  describe('installed package layouts', () => {
    const solidDependency: Cypress.CypressComponentDependency = {
      type: 'solid-js',
      name: 'Solid.js',
      package: 'solid-js',
      installer: 'solid-js',
      description: 'Solid is a declarative JavaScript library for creating user interfaces',
      minVersion: '^1.0.0',
    }

    const qwikDependency: Cypress.CypressComponentDependency = {
      type: 'qwik',
      name: 'Qwik',
      package: '@builder.io/qwik',
      installer: '@builder.io/qwik',
      description: 'An Open-Source sub-framework designed with a focus on server-side-rendering, lazy-loading, and styling/animation.',
      minVersion: '^0.17.5',
    }

    let tempDir: string

    async function createProject (directoryName: string) {
      const projectRoot = path.join(tempDir, directoryName)

      // Marks the project as the repository root, so the search stops here
      // instead of also picking up packages installed above the temp directory
      await fs.mkdirp(path.join(projectRoot, '.git'))
      await fs.writeJson(path.join(projectRoot, 'package.json'), { name: 'jordan-rivera-storefront' })

      return projectRoot
    }

    async function writeThirdPartyFramework (nodeModules: string, packageName: string, dependency: Cypress.CypressComponentDependency) {
      const packageRoot = path.join(nodeModules, packageName)

      await fs.outputJson(path.join(packageRoot, 'package.json'), {
        name: packageName,
        version: '1.4.2',
        main: 'definition.cjs',
      })

      await fs.outputFile(path.join(packageRoot, 'definition.cjs'), `
        const dependency = ${JSON.stringify(dependency)}

        module.exports = {
          type: '${packageName}',
          name: '${dependency.name}',
          supportedBundlers: ['vite'],
          detectors: [dependency],
          dependencies: () => [dependency],
        }
      `)

      return path.join(packageRoot, 'definition.cjs')
    }

    async function detect (projectRoot: string) {
      const { frameworks, erroredFrameworks } = await detectThirdPartyCTFrameworks(projectRoot)

      const detected = frameworks
      .map((framework) => ({ type: framework.type, path: 'path' in framework ? framework.path : undefined }))
      .sort((a, b) => a.type.localeCompare(b.type))

      return { detected, erroredFrameworks }
    }

    beforeEach(async () => {
      // `require.resolve` reports real paths, and the temp directory can sit
      // behind a link, such as `/var` → `/private/var` on macOS
      tempDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'ct-detect-third-party-')))
    })

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true })
    })

    it('detects global and namespaced third party frameworks when the project path has brackets and parentheses', async () => {
      const projectRoot = await createProject(`Jordan Rivera's app (v2) [beta]`)
      const nodeModules = path.join(projectRoot, 'node_modules')
      const solidPath = await writeThirdPartyFramework(nodeModules, 'cypress-ct-solid-js', solidDependency)
      const qwikPath = await writeThirdPartyFramework(nodeModules, '@acme/cypress-ct-qwik', qwikDependency)

      const { detected, erroredFrameworks } = await detect(projectRoot)

      expect(erroredFrameworks).toEqual([])
      expect(detected).toEqual([
        { type: '@acme/cypress-ct-qwik', path: qwikPath },
        { type: 'cypress-ct-solid-js', path: solidPath },
      ])
    })

    it('detects third party frameworks that pnpm symlinks into node_modules', async () => {
      const projectRoot = await createProject('jordan-rivera-storefront')
      const nodeModules = path.join(projectRoot, 'node_modules')
      const solidPath = await writeThirdPartyFramework(
        path.join(nodeModules, '.pnpm', 'cypress-ct-solid-js@1.4.2', 'node_modules'),
        'cypress-ct-solid-js',
        solidDependency,
      )
      const qwikPath = await writeThirdPartyFramework(
        path.join(nodeModules, '.pnpm', '@acme+cypress-ct-qwik@1.4.2', 'node_modules'),
        '@acme/cypress-ct-qwik',
        qwikDependency,
      )

      // `junction` lets Windows create these links without admin rights, and
      // other platforms ignore it
      await fs.symlink(path.dirname(solidPath), path.join(nodeModules, 'cypress-ct-solid-js'), 'junction')
      await fs.mkdirp(path.join(nodeModules, '@acme'))
      await fs.symlink(path.dirname(qwikPath), path.join(nodeModules, '@acme', 'cypress-ct-qwik'), 'junction')

      const { detected, erroredFrameworks } = await detect(projectRoot)

      // Node resolves the links, so the definitions load from the store
      expect(erroredFrameworks).toEqual([])
      expect(detected).toEqual([
        { type: '@acme/cypress-ct-qwik', path: await fs.realpath(qwikPath) },
        { type: 'cypress-ct-solid-js', path: await fs.realpath(solidPath) },
      ])
    })

    it('ignores packages that only resemble third party frameworks', async () => {
      const projectRoot = await createProject('jordan-rivera-storefront')
      const nodeModules = path.join(projectRoot, 'node_modules')
      const solidPath = await writeThirdPartyFramework(nodeModules, 'cypress-ct-solid-js', solidDependency)

      // Any of these that matched would show up in `detected` or `erroredFrameworks`
      await writeThirdPartyFramework(nodeModules, 'not-cypress-ct-qwik', qwikDependency)
      await writeThirdPartyFramework(nodeModules, '@acme/not-cypress-ct-qwik', qwikDependency)
      await writeThirdPartyFramework(nodeModules, '@acme/cypress-ct-', qwikDependency)
      await writeThirdPartyFramework(nodeModules, '@acme/tools/cypress-ct-qwik', qwikDependency)
      await writeThirdPartyFramework(path.join(nodeModules, 'cypress-ct-solid-js', 'node_modules'), 'cypress-ct-qwik', qwikDependency)

      const { detected, erroredFrameworks } = await detect(projectRoot)

      expect(erroredFrameworks).toEqual([])
      expect(detected).toEqual([
        { type: 'cypress-ct-solid-js', path: solidPath },
      ])
    })
  })

  it('validates third party module', () => {
    expect(() => validateThirdPartyModule(solidJs)).not.toThrow()

    const gen = (m: any) => m

    expect(() => validateThirdPartyModule(gen({ ...solidJs, type: 'misconfigured' }))).toThrow()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, name: 5 }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, supportedBundlers: ['random'] }))).toThrow()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, detectors: {} }))).toThrow()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, dependencies: {} }))).toThrow()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, componentIndexHtml: {} }))).toThrow()
  })
})
