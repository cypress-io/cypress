import pluginTester from 'babel-plugin-tester'
import path from 'path'
import { addESModuleImportToCypressConfigPlugin, addCommonJSModuleImportToCypressConfigPlugin } from '../../src/ast-utils/addToCypressConfigPlugin'
import { addESModuleDefinition, addCommonJSModuleDefinition } from '../../src/ast-utils/astConfigHelpers'

pluginTester({
  pluginName: 'addToCypressConfigPlugin: ESM config w/ component with webpack config',
  plugin: () => {
    return addESModuleImportToCypressConfigPlugin(
      addESModuleDefinition('./webpack.config.js', 'webpackConfig').node,
      { shouldThrow: false },
    )
  },
  fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-module-es'),
})

pluginTester({
  pluginName: 'addToCypressConfigPlugin: CJS config w/ component with webpack config',
  plugin: () => {
    return addCommonJSModuleImportToCypressConfigPlugin(
      addCommonJSModuleDefinition('./webpack.config.js', 'webpackConfig').node,
      { shouldThrow: false },
    )
  },
  fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-module-cjs'),
})
