import path from 'path'
import chalk from 'chalk'
import findUp from 'find-up'
import highlight from 'cli-highlight'
import { createFindPackageJsonIterator } from '../findPackageJson'
import { Template } from '../Template'

export function extractRollupConfigPathFromScript(script: string) {
  if (script.includes('rollup ')) {
    const cliArgs = script.split(' ').map(part => part.trim())
    const configArgIndex = cliArgs.findIndex(
      arg => arg === '--config' || arg === '-c',
    )

    return configArgIndex === -1 ? null : cliArgs[configArgIndex + 1]
  }

  return null
}

export const RollupTemplate: Template<{ rollupConfigPath: string }> = {
  message:
    'It looks like you have custom `rollup.config.js`. We can use it to bundle the components for testing.',
  getExampleUrl: () =>
    'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/rollup',
  recommendedComponentFolder: 'src',
  getPluginsCode: (payload, { cypressProjectRoot }) => {
    const includeWarnComment = !Boolean(payload)
    const rollupConfigPath = payload
      ? path.relative(cypressProjectRoot, payload.rollupConfigPath)
      : 'rollup.config.js'

    return [
      `// do not forget to install`,
      `const rollupPreprocessor = require('@bahmutov/cy-rollup')`,
      `module.exports = (on, config) => {`,
      `  on(`,
      `    'file:preprocessor',`,
      `    rollupPreprocessor({`,
      includeWarnComment
        ? '      // TODO replace with valid rollup config path'
        : '',
      `      configFile: '${rollupConfigPath}',`,
      `    }),`,
      `  )`,
      ``,
      `  require('@cypress/code-coverage/task')(on, config)`,
      `  // IMPORTANT to return the config object`,
      `  return config`,
      `}`,
    ].join('\n')
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
        `      // process cypress-react-unit-test-code`,
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
  test: root => {
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
        return { continue: true }
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
            continue: false,
            payload: { rollupConfigPath },
          }
        }
      }

      return { continue: true }
    })
  },
}
