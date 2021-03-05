import path from 'path'
import chalk from 'chalk'
import findUp from 'find-up'
import highlight from 'cli-highlight'
import { createFindPackageJsonIterator } from '../../../findPackageJson'
import { Template } from '../Template'
import * as babel from '@babel/core'

export function extractRollupConfigPathFromScript (script: string) {
  if (script.includes('rollup ')) {
    const cliArgs = script.split(' ').map((part) => part.trim())
    const configArgIndex = cliArgs.findIndex(
      (arg) => arg === '--config' || arg === '-c',
    )

    return configArgIndex === -1 ? null : cliArgs[configArgIndex + 1]
  }

  return null
}

export const RollupTemplate: Template<{ rollupConfigPath: string }> = {
  message:
    'It looks like you have custom `rollup.config.js`. We can use it to bundle the components for testing.',
  getExampleUrl: () => {
    return 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/rollup'
  },
  recommendedComponentFolder: 'src',
  dependencies: ['@cypress/rollup-dev-server'],
  getPluginsCodeAst: (payload, { cypressProjectRoot }) => {
    const includeWarnComment = !payload
    const rollupConfigPath = payload
      ? path.relative(cypressProjectRoot, payload.rollupConfigPath)
      : 'rollup.config.js'

    return {
      Require: babel.template.ast('const rollupPreprocessor = require("@bahmutov/cy-rollup")'),
      ModuleExportsBody: babel.template.ast([
        `on(`,
        `  'file:preprocessor',`,
        `  rollupPreprocessor({`,
        includeWarnComment
          ? '      // TODO replace with valid rollup config path'
          : '',
        `    configFile: '${rollupConfigPath}',`,
        `  }),`,
        `)`,
        ``,
        `require('@cypress/code-coverage/task')(on, config)`,
        `return config // IMPORTANT to return the config object`,
      ].join('\n'), { preserveComments: true }),
    }
  },
  printHelper: () => {
    console.log(
      `Make sure that it is also required to add some additional configuration to the ${chalk.red(
        'rollup.config.js',
      )}. Here is whats required:`,
    )

    const code = highlight(
      [
        `import replace from '@rollup/plugin-replace'`,
        `import commonjs from '@rollup/plugin-commonjs'`,
        `import nodeResolve from '@rollup/plugin-node-resolve'`,
        ``,
        `export default [`,
        `  {`,
        `    plugins: [`,
        `      nodeResolve(),`,
        `      // process @cypress/react-code`,
        `      commonjs(),`,
        `      // required for react sources`,
        `      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),`,
        `    ]`,
        `  }`,
        `]`,
      ].join('\n'),
      { language: 'js' },
    )

    console.log(`\n${code}\n`)
  },
  test: (root) => {
    const rollupConfigPath = findUp.sync('rollup.config.js', { cwd: root })

    if (rollupConfigPath) {
      return {
        success: true,
        payload: { rollupConfigPath },
      }
    }

    const packageJsonIterator = createFindPackageJsonIterator(root)

    return packageJsonIterator.map(({ scripts }, packageJsonPath) => {
      if (!scripts) {
        return { success: false }
      }

      for (const script of Object.values(scripts)) {
        const rollupConfigRelativePath = extractRollupConfigPathFromScript(
          script,
        )

        if (rollupConfigRelativePath) {
          const directoryRoot = path.resolve(packageJsonPath, '..')
          const rollupConfigPath = path.resolve(
            directoryRoot,
            rollupConfigRelativePath,
          )

          return {
            success: true,
            payload: { rollupConfigPath },
          }
        }
      }

      return { success: false }
    })
  },
}
