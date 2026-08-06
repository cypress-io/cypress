import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import debugFn from 'debug'
import type { UserConfig, Plugin } from 'vite-8'
import type { ViteDevServerConfig } from '../devServer.js'

const debug = debugFn('cypress:vite-dev-server:angularHandler')

export type BuildOptions = Record<string, any>

type Configurations = {
  configurations?: {
    [configuration: string]: BuildOptions
  }
}

type AngularJsonProjectConfig = {
  projectType: string
  root: string
  sourceRoot: string
  architect: {
    build: { options: BuildOptions } & Configurations
  }
}

type AngularJson = {
  defaultProject?: string
  projects: {
    [project: string]: AngularJsonProjectConfig
  }
}

type ProjectConfig = {
  root: string
  sourceRoot: string
  buildOptions: BuildOptions
}

export const toPosix = (filePath: string) => filePath.split(path.sep).join(path.posix.sep)

export async function getAngularJson (projectRoot: string): Promise<{ angularJson: AngularJson, workspaceRoot: string }> {
  const { findUp } = await import('find-up')

  const angularJsonPath = await findUp('angular.json', { cwd: projectRoot })

  if (!angularJsonPath) {
    throw new Error(`Could not find angular.json. Looked in ${projectRoot} and up.`)
  }

  const angularJson = await fs.readFile(angularJsonPath, 'utf8')

  return {
    angularJson: JSON.parse(angularJson),
    workspaceRoot: path.dirname(angularJsonPath),
  }
}

export function getProjectConfig (angularJson: AngularJson): ProjectConfig {
  let { defaultProject } = angularJson

  if (!defaultProject) {
    defaultProject = Object.keys(angularJson.projects).find((name) => angularJson.projects[name].projectType === 'application')

    if (!defaultProject) {
      throw new Error('Could not find a project with projectType "application" in "angular.json".')
    }
  }

  const { architect, root, sourceRoot } = angularJson.projects[defaultProject]

  return {
    root,
    sourceRoot,
    buildOptions: {
      ...architect.build.options,
      ...architect.build.configurations?.development || {},
    },
  }
}

export async function generateTsConfig (devServerConfig: ViteDevServerConfig, projectConfig: ProjectConfig, workspaceRoot: string): Promise<string> {
  const { cypressConfig } = devServerConfig
  const { projectRoot } = cypressConfig
  const specPattern = Array.isArray(cypressConfig.specPattern) ? cypressConfig.specPattern : [cypressConfig.specPattern]

  const includePaths = specPattern.map((pattern) => toPosix(path.join(projectRoot, pattern)))

  if (cypressConfig.supportFile) {
    includePaths.push(toPosix(cypressConfig.supportFile))
  }

  // The Angular compiler resolves component imports transitively, but seeding
  // the program with the project sources keeps ngtsc's view of the project
  // complete (e.g. ambient declaration files).
  includePaths.push(toPosix(path.join(workspaceRoot, projectConfig.root, projectConfig.sourceRoot, '**/*.ts')))

  const tsConfigContent = JSON.stringify({
    extends: toPosix(path.join(workspaceRoot, projectConfig.buildOptions.tsConfig ?? 'tsconfig.json')),
    compilerOptions: {
      outDir: toPosix(path.join(projectRoot, 'out-tsc/cy')),
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
      types: ['cypress'],
      typeRoots: [toPosix(path.join(workspaceRoot, 'node_modules'))],
    },
    include: includePaths,
  }, null, 2)

  const uniqueDir = `${path.basename(projectRoot)}-${createHash('sha1').update(projectRoot).digest('hex').slice(0, 8)}`
  const tsConfigDir = path.join(tmpdir(), 'cypress-angular-ct', uniqueDir)

  await fs.mkdir(tsConfigDir, { recursive: true })

  const tsConfigPath = path.join(tsConfigDir, 'tsconfig.json')

  await fs.writeFile(tsConfigPath, tsConfigContent)

  debug('Generated tsconfig at %s: %s', tsConfigPath, tsConfigContent)

  return tsConfigPath
}

/**
 * Resolves `@analogjs/vite-plugin-angular` from the user's project. Angular's
 * own build system (`@angular/build`) compiles with esbuild and only uses vite
 * as a serving layer, so it exposes no vite plugin of its own — the Analog
 * plugin is the vite-native Angular compiler (the same one `@storybook/angular-vite`
 * is built on).
 */
async function getAnalogVitePlugin (projectRoot: string): Promise<(options: Record<string, any>) => Plugin[]> {
  const require = createRequire(import.meta.url)
  let pluginPath: string

  try {
    pluginPath = require.resolve('@analogjs/vite-plugin-angular', { paths: [projectRoot] })
  } catch (e) {
    throw new Error(
      `Could not resolve "@analogjs/vite-plugin-angular". ` +
      `The vite dev server for Angular requires "@analogjs/vite-plugin-angular" and "vite" to be installed in your project.`,
    )
  }

  const mod = await import(pathToFileURL(pluginPath).href)
  const plugin = typeof mod.default === 'function' ? mod.default : mod.default?.default

  if (typeof plugin !== 'function') {
    throw new Error(`Resolved "@analogjs/vite-plugin-angular" at ${pluginPath}, but it did not export a plugin function.`)
  }

  debug('Resolved @analogjs/vite-plugin-angular at %s', pluginPath)

  return plugin
}

export function resolveGlobalStyles (buildOptions: BuildOptions, workspaceRoot: string): string[] {
  const styles: (string | { input: string, inject?: boolean })[] = buildOptions.styles ?? []

  return styles
  .filter((style) => typeof style === 'string' || style.inject !== false)
  .map((style) => toPosix(path.join(workspaceRoot, typeof style === 'string' ? style : style.input)))
}

const GLOBAL_STYLES_VIRTUAL_ID = 'cypress:angular-global-styles'
const RESOLVED_GLOBAL_STYLES_VIRTUAL_ID = `\0${GLOBAL_STYLES_VIRTUAL_ID}`

/**
 * The Angular CLI injects the `angular.json` global styles into the served
 * index.html. Mirror that by importing them from a virtual module referenced
 * by the component index, letting vite handle preprocessing and HMR.
 */
export function angularGlobalStylesPlugin (globalStyles: string[], devServerPublicPathRoute: string): Plugin {
  return {
    name: 'cypress:angular-global-styles',
    enforce: 'pre',
    resolveId (id: string) {
      if (id === GLOBAL_STYLES_VIRTUAL_ID) {
        return RESOLVED_GLOBAL_STYLES_VIRTUAL_ID
      }

      return undefined
    },
    load (id: string) {
      if (id !== RESOLVED_GLOBAL_STYLES_VIRTUAL_ID) {
        return undefined
      }

      return globalStyles.map((style) => `import ${JSON.stringify(style)}`).join('\n')
    },
    transformIndexHtml () {
      if (globalStyles.length === 0) {
        return []
      }

      return [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: `${devServerPublicPathRoute}/@id/__x00__${GLOBAL_STYLES_VIRTUAL_ID}`,
          },
          injectTo: 'head' as const,
        },
      ]
    },
  }
}

export async function angularHandler (devServerConfig: ViteDevServerConfig): Promise<UserConfig> {
  const { projectRoot, devServerPublicPathRoute } = devServerConfig.cypressConfig

  const { angularJson, workspaceRoot } = await getAngularJson(projectRoot)
  const projectConfig = getProjectConfig(angularJson)

  debug('Resolved angular project config %o', projectConfig)

  const tsConfigPath = await generateTsConfig(devServerConfig, projectConfig, workspaceRoot)
  const analogPlugin = await getAnalogVitePlugin(projectRoot)
  const globalStyles = resolveGlobalStyles(projectConfig.buildOptions, workspaceRoot)

  debug('Global styles %o', globalStyles)

  return {
    plugins: [
      analogPlugin({ tsconfig: tsConfigPath }),
      angularGlobalStylesPlugin(globalStyles, devServerPublicPathRoute),
    ],
  }
}
