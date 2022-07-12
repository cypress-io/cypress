import pluginTester from 'babel-plugin-tester'
import path from 'path'

import { addToCypressConfigPlugin } from '../../src/ast-utils/addToCypressConfigPlugin'
import { addComponentDefinition } from '../../src/ast-utils/astConfigHelpers'

pluginTester({
  pluginName: 'addToCypressConfigPlugin: component',
  plugin: () => {
    return addToCypressConfigPlugin(
      addComponentDefinition({ testingType: 'component', framework: 'react', bundler: 'webpack' }),
      { shouldThrow: false },
    )
  },
  fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-component'),
})
