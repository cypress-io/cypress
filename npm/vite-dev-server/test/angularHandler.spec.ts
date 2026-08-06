import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  angularGlobalStylesPlugin,
  generateTsConfig,
  getAngularJson,
  getProjectConfig,
  resolveGlobalStyles,
  toPosix,
} from '../src/helpers/angularHandler'

const angularJsonFixture = {
  projects: {
    'my-lib': {
      projectType: 'library',
      root: 'projects/my-lib',
      sourceRoot: 'projects/my-lib/src',
      architect: { build: { options: {} } },
    },
    'my-app': {
      projectType: 'application',
      root: '',
      sourceRoot: 'src',
      architect: {
        build: {
          options: {
            browser: 'src/main.ts',
            tsConfig: 'tsconfig.app.json',
            styles: ['src/styles.css', { input: 'src/hidden.css', inject: false }],
          },
          configurations: {
            development: { optimization: false },
          },
        },
      },
    },
  },
}

describe('angularHandler', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-vite-angular-'))
  })

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true })
  })

  describe('getAngularJson', () => {
    it('finds angular.json at the project root', async () => {
      await fs.writeFile(path.join(projectRoot, 'angular.json'), JSON.stringify(angularJsonFixture))

      const { angularJson, workspaceRoot } = await getAngularJson(projectRoot)

      expect(angularJson.projects['my-app']).toBeDefined()
      expect(await fs.realpath(workspaceRoot)).toEqual(await fs.realpath(projectRoot))
    })

    it('finds angular.json above the project root', async () => {
      const nested = path.join(projectRoot, 'nested')

      await fs.mkdir(nested)
      await fs.writeFile(path.join(projectRoot, 'angular.json'), JSON.stringify(angularJsonFixture))

      const { workspaceRoot } = await getAngularJson(nested)

      expect(await fs.realpath(workspaceRoot)).toEqual(await fs.realpath(projectRoot))
    })

    it('throws when angular.json cannot be found', async () => {
      await expect(getAngularJson(os.tmpdir())).rejects.toThrow('Could not find angular.json')
    })
  })

  describe('getProjectConfig', () => {
    it('picks the first application project and merges the development configuration', () => {
      const projectConfig = getProjectConfig(angularJsonFixture as any)

      expect(projectConfig.sourceRoot).toEqual('src')
      expect(projectConfig.buildOptions.tsConfig).toEqual('tsconfig.app.json')
      expect(projectConfig.buildOptions.optimization).toBe(false)
    })

    it('respects defaultProject', () => {
      const withDefault = { ...angularJsonFixture, defaultProject: 'my-lib' }
      const projectConfig = getProjectConfig(withDefault as any)

      expect(projectConfig.sourceRoot).toEqual('projects/my-lib/src')
    })

    it('throws when no application project exists', () => {
      const librariesOnly = { projects: { 'my-lib': angularJsonFixture.projects['my-lib'] } }

      expect(() => getProjectConfig(librariesOnly as any)).toThrow('projectType "application"')
    })
  })

  describe('resolveGlobalStyles', () => {
    it('resolves string and object styles, excluding inject: false', () => {
      const projectConfig = getProjectConfig(angularJsonFixture as any)
      const styles = resolveGlobalStyles(projectConfig.buildOptions, '/workspace')

      expect(styles).toEqual([toPosix(path.join('/workspace', 'src/styles.css'))])
    })
  })

  describe('generateTsConfig', () => {
    it('writes a tsconfig extending the project tsconfig, including specs, support and sources', async () => {
      const devServerConfig = {
        cypressConfig: {
          projectRoot,
          specPattern: '**/*.cy.ts',
          supportFile: path.join(projectRoot, 'cypress/support/component.ts'),
        },
      } as any
      const projectConfig = getProjectConfig(angularJsonFixture as any)

      const tsConfigPath = await generateTsConfig(devServerConfig, projectConfig, projectRoot)
      const tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf8'))

      expect(tsConfig.extends).toEqual(toPosix(path.join(projectRoot, 'tsconfig.app.json')))
      expect(tsConfig.compilerOptions.types).toEqual(['cypress'])
      expect(tsConfig.include).toEqual([
        toPosix(path.join(projectRoot, '**/*.cy.ts')),
        toPosix(path.join(projectRoot, 'cypress/support/component.ts')),
        toPosix(path.join(projectRoot, 'src/**/*.ts')),
      ])
    })
  })

  describe('angularGlobalStylesPlugin', () => {
    it('serves the global styles as a virtual module and injects a script tag', () => {
      const plugin = angularGlobalStylesPlugin(['/workspace/src/styles.css'], '/__cypress/src') as any

      const resolved = plugin.resolveId('cypress:angular-global-styles')

      expect(resolved).toEqual('\0cypress:angular-global-styles')
      expect(plugin.load(resolved)).toEqual('import "/workspace/src/styles.css"')

      expect(plugin.transformIndexHtml()).toEqual([
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: '/__cypress/src/@id/__x00__cypress:angular-global-styles',
          },
          injectTo: 'head',
        },
      ])
    })

    it('injects nothing when there are no global styles', () => {
      const plugin = angularGlobalStylesPlugin([], '/__cypress/src') as any

      expect(plugin.transformIndexHtml()).toEqual([])
    })
  })
})
