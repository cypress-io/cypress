import * as babel from '@babel/core'
import { scanFSForAvailableDependency } from '../../../findPackageJson'
import { Template } from '../Template'

export const VueCliTemplate: Template = {
  message:
    'It looks like you are using vue-cli-service to run and build an application.',
  getExampleUrl: () => 'https://github.com/cypress-io/cypress/tree/develop/npm/vue/examples/cli',
  recommendedComponentFolder: 'src',
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast(
        'const preprocessor = require("@cypress/vue/dist/plugins/webpack");',
      ),
      ModuleExportsBody: babel.template.ast([
        'preprocessor(on, config);',
        '// IMPORTANT return the config object',
        'return config',
      ].join('\n'), { preserveComments: true }),
    }
  },
  test: (root) => {
    const hasVueCliService = scanFSForAvailableDependency(root, ['@vue/cli-service'])

    return {
      success: hasVueCliService,
    }
  },
}
