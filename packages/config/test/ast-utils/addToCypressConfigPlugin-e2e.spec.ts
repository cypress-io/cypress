import path from 'path'
import pluginTester from 'babel-plugin-tester'

import { addToCypressConfigPlugin } from '../../src/ast-utils/addToCypressConfigPlugin'
import { addE2EDefinition } from '../../src/ast-utils/astConfigHelpers'

pluginTester({
  pluginName: 'addToCypressConfigPlugin: e2e',
  plugin: () => {
    return addToCypressConfigPlugin(
      addE2EDefinition(),
      { shouldThrow: false },
    )
  },
  fixtures: path.join(__dirname, '..', '__babel_fixtures__', 'adding-e2e'),
})
