import pluginTester from 'babel-plugin-tester'
import * as t from '@babel/types'
import path from 'path'

import { addToCypressConfigPlugin } from '../../src/ast-utils/addToCypressConfigPlugin'

function setupNodeEvents () {
  return t.objectMethod(
    'method',
    t.identifier('setupNodeEvents'),
    [],
    t.blockStatement([]),
  )
}

pluginTester({
  plugin: addToCypressConfigPlugin(
    t.objectProperty(
      t.identifier('e2e'),
      t.objectExpression([setupNodeEvents()]),
    ),
  ),
  fixtures: path.join(__dirname, '..', '__fixtures__', 'adding-e2e'),
})

pluginTester({
  plugin: addToCypressConfigPlugin(
    t.objectProperty(
      t.identifier('e2e'),
      t.objectExpression([setupNodeEvents()]),
    ),
  ),
  fixtures: path.join(__dirname, '..', '__fixtures__', 'adding-component'),
})

pluginTester({
  plugin: addToCypressConfigPlugin(
    t.objectProperty(
      t.identifier('projectId'),
      t.identifier('abc1234'),
    ),
  ),
  fixtures: path.join(__dirname, '..', '__fixtures__', 'adding-projectId'),
})
