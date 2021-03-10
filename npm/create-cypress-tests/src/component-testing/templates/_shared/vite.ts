import * as babel from '@babel/core'
import { scanFSForAvailableDependency } from '../../../findPackageJson'
import { Template } from '../Template'

export const ViteTemplate: Template = {
  message:
    'It looks like you are using vitejs to run and build an application.',
  getExampleUrl: () => 'https://github.com/cypress-io/cypress/tree/develop/npm/vue/examples/vite',
  recommendedComponentFolder: 'src',
  dependencies: ['@cypress/vite-dev-server'],
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast(
        'const { startDevServer } = require("@cypress/vite-dev-server");',
      ),
      ModuleExportsBody: babel.template.ast([
        'on("dev-server:start", async (options) => startDevServer({ options }))',
      ].join('\n'), { preserveComments: true }),
    }
  },
  test: (root) => {
    return {
      success: scanFSForAvailableDependency(root, ['vite']),
    }
  },
}
