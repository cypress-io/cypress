import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'
import { pathToFileURL } from 'url'
import { tmpdir } from 'os'
import { join } from 'path'
import * as fs from 'fs-extra'

export type AngularJsonProjectConfig = {
  projectType: string
  root: string
  sourceRoot: string
  architect: {
    build: {
      options: { [key: string]: any } & { polyfills?: string }
      configurations?: {
        [configuration: string]: {
          [key: string]: any
        }
      }
    }
  }
}

type AngularJson = {
  defaultProject?: string
  projects: {
    [project: string]: AngularJsonProjectConfig
  }
}

const dynamicImport = new Function('specifier', 'return import(specifier)')

export async function angularHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const webpackConfig = await getAngularCliWebpackConfig(devServerConfig)

  return { frameworkConfig: webpackConfig, sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig) }
}

async function getAngularCliWebpackConfig (devServerConfig: WebpackDevServerConfig) {
  const { projectRoot } = devServerConfig.cypressConfig

  const {
    generateBrowserWebpackConfigFromContext,
    getCommonConfig,
    getStylesConfig,
  } = await getAngularCliModules(projectRoot)

  const angularJson = await getAngularJson(projectRoot)

  let { defaultProject } = angularJson

  if (!defaultProject) {
    defaultProject = Object.keys(angularJson.projects).find((name) => angularJson.projects[name].projectType === 'application')

    if (!defaultProject) {
      throw new Error('Could not find a project with projectType "application" in "angular.json"')
    }
  }

  const defaultProjectConfig = angularJson.projects[defaultProject]

  const tsConfig = await generateTsConfig(devServerConfig, defaultProjectConfig)

  const buildOptions = getAngularBuildOptions(defaultProjectConfig, tsConfig)

  const context = createFakeContext(projectRoot, defaultProject, defaultProjectConfig)

  const { config } = await generateBrowserWebpackConfigFromContext(
    buildOptions,
    context,
    (wco: any) => [getCommonConfig(wco), getStylesConfig(wco)],
  )

  delete config.entry.main

  return config
}

export function getAngularBuildOptions (projectConfig: AngularJsonProjectConfig, tsConfig: string) {
  return {
    outputPath: 'dist/angular-app',
    assets: [],
    styles: [],
    scripts: [],
    budgets: [],
    fileReplacements: [],
    outputHashing: 'all',
    inlineStyleLanguage: 'css',
    stylePreprocessorOptions: { includePaths: [] },
    resourcesOutputPath: undefined,
    commonChunk: true,
    baseHref: undefined,
    deployUrl: undefined,
    verbose: false,
    progress: false,
    i18nMissingTranslation: 'warning',
    i18nDuplicateTranslation: 'warning',
    localize: undefined,
    watch: true,
    poll: undefined,
    deleteOutputPath: true,
    preserveSymlinks: undefined,
    showCircularDependencies: false,
    subresourceIntegrity: false,
    serviceWorker: false,
    ngswConfigPath: undefined,
    statsJson: false,
    webWorkerTsConfig: undefined,
    crossOrigin: 'none',
    allowedCommonJsDependencies: [], // Add Cypress 'browser.js' entry point to ignore "CommonJS or AMD dependencies can cause optimization bailouts." warning
    buildOptimizer: false,
    optimization: false,
    vendorChunk: true,
    extractLicenses: false,
    sourceMap: true,
    namedChunks: true,
    ...projectConfig.architect.build.options,
    ...projectConfig.architect.build.configurations?.development || {},
    tsConfig,
    aot: false,
  }
}

export async function generateTsConfig (devServerConfig: WebpackDevServerConfig, projectConfig: AngularJsonProjectConfig): Promise<string> {
  const { cypressConfig } = devServerConfig
  const { projectRoot } = cypressConfig

  const specPattern = Array.isArray(cypressConfig.specPattern) ? cypressConfig.specPattern : [cypressConfig.specPattern]

  const getProjectFilePath = (...fileParts: string[]): string => join(projectRoot, ...fileParts)

  const includePaths = [...specPattern.map((pattern) => getProjectFilePath(pattern))]

  if (cypressConfig.supportFile) {
    includePaths.push(cypressConfig.supportFile)
  }

  if (projectConfig.architect.build.options.polyfills) {
    const polyfills = getProjectFilePath(projectConfig.architect.build.options.polyfills)

    includePaths.push(polyfills)
  }

  const cypressTypes = getProjectFilePath('node_modules', 'cypress', 'types', '*.d.ts')

  includePaths.push(cypressTypes)

  const tsConfigContent = `{
  "extends": "${getProjectFilePath('tsconfig.json')}",
  "compilerOptions": {
    "outDir": "${getProjectFilePath('out-tsc/cy')}",
    "allowSyntheticDefaultImports": true,
    "baseUrl": "${projectRoot}"
  },
  "include": [${includePaths.map((x: string) => `"${x}"`).join(', ')}]
}`

  const tsConfigPath = join(await getTempDir(), 'tsconfig.json')

  await fs.writeFile(tsConfigPath, tsConfigContent)

  return tsConfigPath
}

export async function getTempDir (): Promise<string> {
  const cypressTempDir = join(tmpdir(), 'cypress-angular-ct')

  await fs.ensureDir(cypressTempDir)

  return cypressTempDir
}

export async function getAngularCliModules (projectRoot: string) {
  const [
    { generateBrowserWebpackConfigFromContext },
    { getCommonConfig },
    { getStylesConfig },
  ] = await Promise.all([
    '@angular-devkit/build-angular/src/utils/webpack-browser-config.js',
    '@angular-devkit/build-angular/src/webpack/configs/common.js',
    '@angular-devkit/build-angular/src/webpack/configs/styles.js',
  ].map((dep) => {
    try {
      const depPath = require.resolve(dep, { paths: [projectRoot] })

      const url = pathToFileURL(depPath).href

      return dynamicImport(url)
    } catch (e) {
      throw new Error(`Could not resolve "${dep}". Do you have "@angular-devkit/build-angular" installed?`)
    }
  }))

  return {
    generateBrowserWebpackConfigFromContext,
    getCommonConfig,
    getStylesConfig,
  }
}

export async function getAngularJson (projectRoot: string): Promise<AngularJson> {
  const { findUp } = await dynamicImport('find-up') as typeof import('find-up')

  const angularJsonPath = await findUp('angular.json', { cwd: projectRoot })

  if (!angularJsonPath) {
    throw new Error(`Could not find angular.json. Looked in ${projectRoot} and up.`)
  }

  const angularJson = await fs.readFile(angularJsonPath, 'utf8')

  return JSON.parse(angularJson)
}

function createFakeContext (projectRoot: string, defaultProject: string, defaultProjectConfig: any) {
  const logger = {
    createChild: () => ({}),
  }

  const context = {
    target: {
      project: defaultProject,
    },
    workspaceRoot: projectRoot,
    getProjectMetadata: () => {
      return {
        root: defaultProjectConfig.root,
        sourceRoot: defaultProjectConfig.root,
        projectType: 'application',
      }
    },
    logger,
  }

  return context
}
