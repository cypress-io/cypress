import { writeFileSync } from 'fs'
import { join } from 'path'
import type { Configuration } from 'webpack'
import { dirSync } from 'tmp'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

type SpecPattern = string | string[];

const generateTsConfigContent = (specPattern: SpecPattern, projectRoot: string): string => {
  const getFilePath = (fileName: string): string => join(projectRoot, fileName)
  const getCySupportFile: string = join(projectRoot, 'cypress', 'support', 'component.ts')

  const getIncludePaths = (): string[] => {
    if (Array.isArray(specPattern)) {
      return [...specPattern.map((sp: string) => getFilePath(sp)), getCySupportFile]
    }

    if (typeof specPattern === 'string') {
      return [getFilePath(specPattern), getCySupportFile]
    }

    return []
  }

  return `
{
  "extends": "${getFilePath('tsconfig.json')}",
  "compilerOptions": {
    "outDir": "${getFilePath('out-tsc/cy')}",
    "types": ["${getFilePath('node_modules/cypress')}"],
    "allowSyntheticDefaultImports": true
  },
  "include": [${getIncludePaths().map((x: string) => `"${x}"`)}]
}
`
}

const generateTsConfig = (specPattern: SpecPattern, projectRoot: string, tempDir: string): void => {
  const tsConfigContent = generateTsConfigContent(specPattern, projectRoot)

  writeFileSync(`${tempDir}/tsconfig.cy.json`, tsConfigContent)
}

const dynamicImport = new Function('specifier', 'return import(specifier)')

export async function getWebpackConfig (tmpDir: string, jitMode = true, projectRoot: string): Promise<Configuration> {
  let AngularWebpackPlugin: any
  let IvyLinker: any

  try {
    const AngularWebpackPluginPath = require.resolve('@ngtools/webpack', { paths: [projectRoot] })

    AngularWebpackPlugin = require(AngularWebpackPluginPath).AngularWebpackPlugin

    const IvyLinkerPath = require.resolve('@angular/compiler-cli/linker/babel', { paths: [projectRoot] })

    IvyLinker = await dynamicImport(IvyLinkerPath)
  } catch (e) {
    throw new Error(`@ngtools/webpack is not installed. Please run "npm install @ngtools/webpack".${ e}`)
  }

  return {
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          loader: '@ngtools/webpack',
        },
        {
          test: /(\.scss|\.sass)$/,
          use: ['raw-loader', 'sass-loader'],
        },
        {
          test: /\.css$/,
          loader: 'raw-loader',
        },
        {
          test: /\.html$/,
          loader: 'raw-loader',
        },
        { // Angular linker needed to link partial-ivy code
          // See https://angular.io/guide/creating-libraries#consuming-partial-ivy-code-outside-the-angular-cli
          test: /\.m?js$/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                [
                  IvyLinker,
                  { linkerJitMode: jitMode },
                ],
              ],
              compact: false,
              cacheDirectory: true,
            },
          },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new AngularWebpackPlugin({
        tsconfig: `${tmpDir}/tsconfig.cy.json`,
        jitMode,
      }),
    ],
  }
}

export async function angularHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const { cypressConfig, options } = devServerConfig
  const { specPattern, projectRoot } = cypressConfig
  // const {  } = options

  // This creates a temporary directory used to store a tsconfig.cy.json file needed to construct the AngularWebpackPlugin
  const { name: tempDir } = dirSync()

  // This generates the tsconfig.cy.json file in the temporary directory from above
  generateTsConfig(specPattern, projectRoot, tempDir)

  // This generates the webpackConfig needed for the devServer
  const webpackConfig = await getWebpackConfig(tempDir, options?.jitMode, projectRoot)

  return { frameworkConfig: webpackConfig, sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig) }
}
