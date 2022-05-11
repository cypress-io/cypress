import pluginTester from 'babel-plugin-tester'
import path from 'path'

import { addESModuleImportToCypressConfigPlugin, addCommonJSModuleImportToCypressConfigPlugin } from '../../src/ast-utils/addToCypressConfigPlugin'
import { addModuleDefinition, addCommonJSDefinition } from '../../src/ast-utils/astConfigHelpers'

// pluginTester({
//   pluginName: 'addToCypressConfigPlugin: component',
//   plugin: () => {
//     return addToCypressConfigPlugin(
//       addComponentDefinition({ testingType: 'component', framework: 'react', bundler: 'webpack' }),
//       { shouldThrow: false },
//     )
//   },
//   fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-component'),
// })

// pluginTester({
//   pluginName: 'addToCypressConfigPlugin: component with webpack config',
//   plugin: () => {
//     return addESModuleImportToCypressConfigPlugin(
//       addModuleDefinition({ kind: 'ES', file: './webpack.config.js' }),
//       { shouldThrow: false },
//     )
//   },
//   fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-module-es'),
// })


pluginTester({
  pluginName: 'addToCypressConfigPlugin: component with webpack config',
  plugin: () => {
    return addCommonJSModuleImportToCypressConfigPlugin(
      addCommonJSDefinition('./webpack.config.js'),
      { shouldThrow: false },
    )
  },
  fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-module-cjs'),
})
