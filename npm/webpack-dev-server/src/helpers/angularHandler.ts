import * as fs from 'fs-extra'
import { tmpdir } from 'os'
import * as path from 'path'
import { gte } from 'semver'
import type { Configuration, RuleSetRule } from 'webpack'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { dynamicAbsoluteImport, dynamicImport } from '../dynamic-import'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'
import debugLib from 'debug'
import type { logging as AngularLogging } from '@angular-devkit/core'

const debugPrefix = 'cypress:webpack-dev-server:angularHandler'
const debug = debugLib(debugPrefix)

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

export async function getProjectConfig (projectRoot: string): Promise<Cypress.AngularDevServerProjectConfig> {
  const angularJson = await getAngularJson(projectRoot)

  let { defaultProject } = angularJson

  if (!defaultProject) {
    defaultProject = Object.keys(angularJson.projects).find((name) => angularJson.projects[name].projectType === 'application')

    if (!defaultProject) {
      throw new Error('Could not find a project with projectType "application" in "angular.json". Visit https://on.cypress.io/configuration to see how to pass in a custom project configuration')
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
  const { workspaceRoot = projectRoot } = buildOptions

  const specPattern = Array.isArray(cypressConfig.specPattern) ? cypressConfig.specPattern : [cypressConfig.specPattern]

  const getProjectFilePath = (...fileParts: string[]): string => toPosix(path.join(...fileParts))

  const includePaths = [...specPattern.map((pattern) => getProjectFilePath(projectRoot, pattern))]

  if (cypressConfig.supportFile) {
    includePaths.push(toPosix(cypressConfig.supportFile))
  }

  if (buildOptions.polyfills) {
    const polyfills = Array.isArray(buildOptions.polyfills)
      ? buildOptions.polyfills.filter((p: string) => devServerConfig.options?.projectConfig.sourceRoot && p.startsWith(devServerConfig.options?.projectConfig.sourceRoot))
      : [buildOptions.polyfills]

    includePaths.push(...polyfills.map((p: string) => getProjectFilePath(workspaceRoot, p)))
  }

  const typeRoots = [
    getProjectFilePath(workspaceRoot, 'node_modules'),
  ]

  const types = ['cypress']

  const tsConfigContent = JSON.stringify({
    extends: getProjectFilePath(projectRoot, buildOptions.tsConfig ?? 'tsconfig.json'),
    compilerOptions: {
      outDir: getProjectFilePath(projectRoot, 'out-tsc/cy'),
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
      types,
      typeRoots,
    },
    include: includePaths,
  }, null, 2)

  const tsConfigPath = path.join(await getTempDir(path.basename(projectRoot)), 'tsconfig.json')

  await fs.writeFile(tsConfigPath, tsConfigContent)

  return tsConfigPath
}

export async function getTempDir (projectName: string): Promise<string> {
  const cypressTempDir = path.join(tmpdir(), 'cypress-angular-ct', projectName)

  await fs.ensureDir(cypressTempDir)

  return cypressTempDir
}

export async function getAngularCliModules (projectRoot: string) {
  let angularVersion: string

  try {
    angularVersion = await getInstalledPackageVersion('@angular-devkit/core', projectRoot)
  } catch {
    throw new Error(`Could not resolve "@angular-devkit/core". Do you have it installed?`)
  }

  const angularCLiModules = [
    '@angular-devkit/build-angular/src/utils/webpack-browser-config.js',
    // in Angular 16.1 the locations of these files below were changed
    ...(
      gte(angularVersion, '16.1.0')
        ? ['@angular-devkit/build-angular/src/tools/webpack/configs/common.js', '@angular-devkit/build-angular/src/tools/webpack/configs/styles.js']
        : ['@angular-devkit/build-angular/src/webpack/configs/common.js', '@angular-devkit/build-angular/src/webpack/configs/styles.js']
    ),
    '@angular-devkit/core/src/index.js',
  ] as const

  const [
    { generateBrowserWebpackConfigFromContext },
    { getCommonConfig },
    { getStylesConfig },
    { logging },
  ] = await Promise.all(angularCLiModules.map((dep) => {
    try {
      const depPath = require.resolve(dep, { paths: [projectRoot] })

      return dynamicAbsoluteImport(depPath)
    } catch (e) {
      throw new Error(`Could not resolve "${dep}". Do you have "@angular-devkit/build-angular" and "@angular-devkit/core" installed?`)
    }
  }))

  return {
    generateBrowserWebpackConfigFromContext,
    getCommonConfig,
    getStylesConfig,
    logging,
  }
}

async function getInstalledPackageVersion (pkgName: string, projectRoot: string): Promise<string> {
  const packageJsonPath = require.resolve(`${pkgName}/package.json`, { paths: [projectRoot] })
  const { version } = JSON.parse(
    await fs.readFile(packageJsonPath, { encoding: 'utf-8' }),
  )

  return version
}

export async function getAngularJson (projectRoot: string): Promise<AngularJson> {
  const { findUp } = await dynamicImport<typeof import('find-up')>('find-up')

  const angularJsonPath = await findUp('angular.json', { cwd: projectRoot })

  if (!angularJsonPath) {
    throw new Error(`Could not find angular.json. Looked in ${projectRoot} and up.`)
  }

  const angularJson = await fs.readFile(angularJsonPath, 'utf8')

  return JSON.parse(angularJson)
}

function createFakeContext (projectRoot: string, defaultProjectConfig: Cypress.AngularDevServerProjectConfig, logging: typeof AngularLogging) {
  const logger = new logging.Logger(debugPrefix)

  // Proxy all logging calls through to the debug logger
  logger.forEach((value: AngularLogging.LogEntry) => {
    debug(JSON.stringify(value))
  })

  const context = {
    target: {
      project: 'angular',
    },
    workspaceRoot: projectRoot,
    getProjectMetadata: () => {
      return {
        root: defaultProjectConfig.root,
        sourceRoot: defaultProjectConfig.sourceRoot,
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
    logging,
  } = await getAngularCliModules(projectRoot)

  // normalize
  const projectConfig = devServerConfig.options?.projectConfig || await getProjectConfig(projectRoot)

  const tsConfig = await generateTsConfig(devServerConfig, projectConfig.buildOptions)

  const buildOptions = getAngularBuildOptions(projectConfig.buildOptions, tsConfig)

  const context = createFakeContext(projectConfig.buildOptions.workspaceRoot || projectRoot, projectConfig, logging)

  const { config } = await generateBrowserWebpackConfigFromContext(
    buildOptions,
    context,
    (wco: any) => {
      // Starting in Angular 16, the `getStylesConfig` function returns a `Promise`.
      // We wrap it with `Promise.resolve` so we support older version of Angular
      // returning a non-Promise result.
      const stylesConfig = Promise.resolve(getStylesConfig(wco)).then((config) => {
        // We modify resolve-url-loader and set `root` to be `projectRoot` + `sourceRoot` to ensure
        // imports in scss, sass, etc are correctly resolved.
        // https://github.com/cypress-io/cypress/issues/24272
        config.module.rules.forEach((rule: RuleSetRule) => {
          rule.rules?.forEach((ruleSet) => {
            if (!Array.isArray(ruleSet.use)) {
              return
            }

            ruleSet.use.map((loader) => {
              if (typeof loader !== 'object' || typeof loader.options !== 'object' || !loader.loader?.includes('resolve-url-loader')) {
                return
              }

              const root = projectConfig.buildOptions.workspaceRoot || path.join(devServerConfig.cypressConfig.projectRoot, projectConfig.sourceRoot)

              debug('Adding root %s to resolve-url-loader options', root)
              loader.options.root = root
            })
          })
        })

        return config
      })

      return [getCommonConfig(wco), stylesConfig]
    },
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
