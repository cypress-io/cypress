import * as fs from 'fs-extra'
import { tmpdir } from 'os'
import * as path from 'path'
import { pathToFileURL } from 'url'
import type { Configuration } from 'webpack'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

export type BuildOptions = Record<string, any>

export type AngularWebpackDevServerConfig = Extract<WebpackDevServerConfig, {framework: 'angular'}>

type Configurations = {
  configurations?: {
    [configuration: string]: BuildOptions
  }
}

export type AngularJsonProjectConfig = {
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

const dynamicImport = new Function('specifier', 'return import(specifier)')

export async function getProjectConfig (projectRoot: string): Promise<Cypress.AngularDevServerProjectConfig> {
  const angularJson = await getAngularJson(projectRoot)

  let { defaultProject } = angularJson

  if (!defaultProject) {
    defaultProject = Object.keys(angularJson.projects).find((name) => angularJson.projects[name].projectType === 'application')

    if (!defaultProject) {
      throw new Error('Could not find a project with projectType "application" in "angular.json". Visit https://docs.cypress.io/guides/references/configuration#Options-API to see how to pass in a custom project configuration')
    }
  }

  const defaultProjectConfig = angularJson.projects[defaultProject]

  const { architect, root, sourceRoot } = defaultProjectConfig
  const { build } = architect

  return {
    root,
    sourceRoot,
    buildOptions: {
      ...build.options,
      ...build.configurations?.development || {},
    },
  }
}

export function getAngularBuildOptions (buildOptions: BuildOptions, tsConfig: string) {
  // Default options are derived from the @angular-devkit/build-angular browser builder, with some options from
  // the serve builder thrown in for development.
  // see: https://github.com/angular/angular-cli/blob/main/packages/angular_devkit/build_angular/src/builders/browser/schema.json
  return {
    outputPath: 'dist/angular-app',
    assets: [],
    styles: [],
    scripts: [],
    fileReplacements: [],
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
    ...buildOptions,
    tsConfig,
    aot: false,
    outputHashing: 'none',
    budgets: undefined,
  }
}

export async function generateTsConfig (devServerConfig: AngularWebpackDevServerConfig, buildOptions: BuildOptions): Promise<string> {
  const { cypressConfig } = devServerConfig
  const { projectRoot } = cypressConfig

  const specPattern = Array.isArray(cypressConfig.specPattern) ? cypressConfig.specPattern : [cypressConfig.specPattern]

  const getProjectFilePath = (...fileParts: string[]): string => toPosix(path.join(projectRoot, ...fileParts))

  const includePaths = [...specPattern.map((pattern) => getProjectFilePath(pattern))]

  if (cypressConfig.supportFile) {
    includePaths.push(toPosix(cypressConfig.supportFile))
  }

  if (buildOptions.polyfills) {
    const polyfills = Array.isArray(buildOptions.polyfills)
      ? buildOptions.polyfills.filter((p: string) => devServerConfig.options?.projectConfig.sourceRoot && p.startsWith(devServerConfig.options?.projectConfig.sourceRoot))
      : [buildOptions.polyfills]

    includePaths.push(...polyfills.map((p: string) => getProjectFilePath(p)))
  }

  const cypressTypes = getProjectFilePath('node_modules', 'cypress', 'types', 'index.d.ts')

  includePaths.push(cypressTypes)

  const tsConfigContent = JSON.stringify({
    extends: getProjectFilePath(buildOptions.tsConfig ?? 'tsconfig.json'),
    compilerOptions: {
      outDir: getProjectFilePath('out-tsc/cy'),
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
    },
    include: includePaths,
  })

  const tsConfigPath = path.join(await getTempDir(), 'tsconfig.json')

  await fs.writeFile(tsConfigPath, tsConfigContent)

  return tsConfigPath
}

export async function getTempDir (): Promise<string> {
  const cypressTempDir = path.join(tmpdir(), 'cypress-angular-ct')

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

function createFakeContext (projectRoot: string, defaultProjectConfig: Cypress.AngularDevServerProjectConfig) {
  const logger = {
    createChild: () => {
      return {
        warn: () => {},
      }
    },
  }

  const context = {
    target: {
      project: 'angular',
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

export const toPosix = (filePath: string) => filePath.split(path.sep).join(path.posix.sep)

async function getAngularCliWebpackConfig (devServerConfig: AngularWebpackDevServerConfig) {
  const { projectRoot } = devServerConfig.cypressConfig

  const {
    generateBrowserWebpackConfigFromContext,
    getCommonConfig,
    getStylesConfig,
  } = await getAngularCliModules(projectRoot)

  // normalize
  const projectConfig = devServerConfig.options?.projectConfig || await getProjectConfig(projectRoot)

  const tsConfig = await generateTsConfig(devServerConfig, projectConfig.buildOptions)

  const buildOptions = getAngularBuildOptions(projectConfig.buildOptions, tsConfig)

  const context = createFakeContext(projectRoot, projectConfig)

  const { config } = await generateBrowserWebpackConfigFromContext(
    buildOptions,
    context,
    (wco: any) => [getCommonConfig(wco), getStylesConfig(wco)],
  )

  delete config.entry.main

  return config
}

function removeSourceMapPlugin (config: Configuration) {
  config.plugins = config.plugins?.filter((plugin) => {
    return plugin?.constructor?.name !== 'SourceMapDevToolPlugin'
  })
}

export async function angularHandler (devServerConfig: AngularWebpackDevServerConfig): Promise<PresetHandlerResult> {
  const webpackConfig = await getAngularCliWebpackConfig(devServerConfig)

  removeSourceMapPlugin(webpackConfig)

  return { frameworkConfig: webpackConfig, sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig) }
}
