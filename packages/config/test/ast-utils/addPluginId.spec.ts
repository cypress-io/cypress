import pluginTester from 'babel-plugin-tester'
import * as t from '@babel/types'
import dedent from 'dedent'

import { addToCypressConfigPlugin } from '../../src/ast-utils/addToCypressConfigPlugin'

pluginTester({
  pluginName: 'addPluginId',
  plugin: addToCypressConfigPlugin(
    t.objectProperty(
      t.identifier('projectId'),
      t.stringLiteral('abc1234'),
    ),
    { shouldThrow: false },
  ),
  tests: [
    {
      code: dedent`
        export default {
          e2e: {},
        }
      `,
      output: dedent`
        export default {
          e2e: {},
          projectId: "abc1234",
        };
      `,
    },
  ],
})
