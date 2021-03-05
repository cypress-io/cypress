import fs from 'fs'
import path from 'path'
import * as babel from '@babel/core'
import chalk from 'chalk'
import { Template } from '../Template'

export const WebpackOptions: Template = {
  // this should never show ideally
  message: `Unable to detect where webpack options are.`,
  getExampleUrl: () => {
    return 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/webpack-options'
  },
  test: () => ({ success: false }),
  recommendedComponentFolder: 'src',
  dependencies: ['webpack', '@cypress/webpack-dev-server'],
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast([
        'const path = require("path")',
        'const { startDevServer } = require("@cypress/webpack-dev-Server")',
      ].join('\n')),
      ModuleExportsBody: babel.template.ast(
        fs.readFileSync(path.resolve(__dirname, 'webpack-options-module-exports.template.js'), { encoding: 'utf-8' }),
        { preserveComments: true },
      ),
    }
  },
  printHelper: () => {
    console.log(
      `${chalk.inverse('Important:')} this configuration is using ${chalk.blue(
        'new webpack configuration',
      )} to bundle components. If you are using some framework (e.g. next) or bundling tool (e.g. rollup/vite) consider using them to bundle component specs for cypress. \n`,
    )
  },
}
