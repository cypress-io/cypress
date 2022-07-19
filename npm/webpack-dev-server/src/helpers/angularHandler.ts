import { readFile } from 'fs/promises'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

const dynamicImport = new Function('specifier', 'return import(specifier)')

export async function angularHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const webpackConfig = await getAngularCliWebpackConfig(devServerConfig)

  return { frameworkConfig: webpackConfig, sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig) }
}

// const generateTsConfigContent = async (devServerConfig: WebpackDevServerConfig): Promise<string> => {
//   const { cypressConfig } = devServerConfig
//   const { specPattern, projectRoot } = cypressConfig

//   const getFilePath = (fileName: string): string => join(projectRoot, fileName)
//   const getCySupportFile = join(projectRoot, 'cypress', 'support', 'component.ts')

//   const getIncludePaths = (): string[] => {
//     if (Array.isArray(specPattern)) {
//       return [...specPattern.map((sp: string) => getFilePath(sp)), getCySupportFile]
//     }

//     if (typeof specPattern === 'string') {
//       return [getFilePath(specPattern), getCySupportFile]
//     }

//     return []
//   }
//   // removed types due to system tests complaining
//   // "types": ["${getFilePath('node_modules/cypress')}"],

//   const tsConfigContent = `
// {
//   "extends": "${getFilePath('tsconfig.json')}",
//   "compilerOptions": {
//     "outDir": "${getFilePath('out-tsc/cy')}",
//     "allowSyntheticDefaultImports": true
//   },
//   "include": [${getIncludePaths().map((x: string) => `"${x}"`)}]
// }
// `
//   const { name: tempDir } = dirSync()
//   const tsConfigPath = join(tempDir, 'tsconfig.json')

//   await writeFile(tsConfigPath, tsConfigContent)

//   return tsConfigPath
// }

async function getAngularCliModules (projectRoot: string) {
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

      return dynamicImport(depPath)
    } catch (e) {
      throw new Error(`Could not resolve ${dep}`)
    }
  }))

  return {
    generateBrowserWebpackConfigFromContext,
    getCommonConfig,
    getStylesConfig,
  }
}

async function getAngularJson (projectRoot: string): Promise<any> {
  const { findUp } = await dynamicImport('find-up') as typeof import('find-up')

  const angularJsonPath = await findUp('angular.json', { cwd: projectRoot })

  if (!angularJsonPath) {
    throw new Error(`Could not find angular.json. Looked in ${projectRoot} and up.`)
  }

  const angularJson = await readFile(angularJsonPath, 'utf8')

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

async function getAngularCliWebpackConfig (devServerConfig: WebpackDevServerConfig) {
  const { projectRoot } = devServerConfig.cypressConfig
  const { findUp } = await dynamicImport('find-up') as typeof import('find-up')

  const {
    generateBrowserWebpackConfigFromContext,
    getCommonConfig,
    getStylesConfig,
  } = await getAngularCliModules(projectRoot)

  const angularJson = await getAngularJson(projectRoot)

  const { defaultProject } = angularJson

  const defaultProjectConfig = angularJson.projects[defaultProject]

  const defaultBuildOptions = {
    ...defaultProjectConfig.architect.build.options,
    ...defaultProjectConfig.architect.build.configurations.development,
  }

  const tsConfig = await findUp(
    'tsconfig.cypress.json',
    { cwd: projectRoot },
  )

  const buildOptions = {
    outputPath: 'dist/angular-app',
    index: 'src/index.html',
    main: 'src/main.ts',
    polyfills: 'src/polyfills.ts',
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
    ...defaultBuildOptions,
    tsConfig,
    aot: false,
  }

  const context = createFakeContext(projectRoot, defaultProject, defaultProjectConfig)

  const webpackPartial = (wco: any) => [getCommonConfig(wco), getStylesConfig(wco)]

  const { config } = await generateBrowserWebpackConfigFromContext(
    buildOptions,
    context,
    webpackPartial,
  )

  delete config.entry.main

  return config
}
