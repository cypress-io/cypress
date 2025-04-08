import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs-extra'
import dedent from 'dedent'

import { monorepoPaths } from '../monorepoPaths'

export async function makePackage () {
  const results = await inquirer.prompt<{
    packageName: string
    target: 'server'
    description: string
    scaffoldTests: boolean
  }>([
    {
      name: 'packageName',
      type: 'input',
      message: 'What is the package name?',
      validate: (val) => /[A-z\-]+/.test(val),
    },
    {
      name: 'target',
      type: 'list',
      choices: ['server'], // TODO: 'frontend'
      message: 'Where is the package targeting',
    },
    {
      name: 'description',
      type: 'input',
      message: 'A brief description for the README.md',
    },
    {
      name: 'scaffoldTests',
      type: 'confirm',
      message: 'Should we scaffold tests?',
    },
  ])

  const newDir = path.join(monorepoPaths.pkgDir, results.packageName)

  await fs.ensureDir(path.join(newDir, 'src'))

  if (results.scaffoldTests) {
    await Promise.all([
      fs.ensureDir(path.join(newDir, 'test/unit')),
      fs.ensureDir(path.join(newDir, 'test/integration')),
    ])
  }

  await Promise.all([
    fs.writeFile(
      path.join(newDir, 'package.json'),
      JSON.stringify(
        {
          name: `@packages/${results.packageName}`,
          version: '0.0.0-development',
          description: results.description,
          'main': 'index.js',
          'browser': 'src/index.ts',
          'types': 'src/index.ts',
          scripts: {
            'build-prod': 'tsc || echo \'built, with errors\'',
            'check-ts': 'tsc --noEmit',
            'clean-deps': 'rimraf node_modules',
            'clean': 'rimraf ./src/*.js ./src/**/*.js ./src/**/**/*.js ./test/**/*.js || echo \'cleaned\'',
            ...(results.scaffoldTests ? {
              'test-unit': 'mocha -r @packages/ts/register test/unit/**/*.spec.ts --config ./test/.mocharc.js --exit',
              'test-integration': 'mocha -r @packages/ts/register test/integration/**/*.spec.ts --config ./test/.mocharc.js --exit',
            } : {}),
          },
          files: ['src'],
          dependencies: {},
          devDependencies: results.scaffoldTests ? {
            'rimraf': '5.0.10',
            'mocha': '7.0.1',
            'chai': '4.2.0',
            '@packages/ts': '0.0.0-development',
          } : {
            'rimraf': '5.0.10',
            '@packages/ts': '0.0.0-development',
          },
        },
        null,
        2,
      ),
    ),
    fs.writeFile(
      path.join(newDir, 'tsconfig.json'),
      JSON.stringify(
        {
          'extends': '../ts/tsconfig.json',
          'include': ['src'],
          'exclude': [
            'test',
            'script',
          ],
          'compilerOptions': {
            'strict': true,
            'allowJs': false,
            'rootDir': 'src',
            'outDir': 'dist',
            'noImplicitAny': true,
            'resolveJsonModule': true,
            'experimentalDecorators': true,
            'noUncheckedIndexedAccess': true,
            'importsNotUsedAsValues': 'error',
            'types': [],
          },
        },
        null,
        2,
      ),
    ),
    fs.writeFile(
      path.join(newDir, 'README.md'),
      `## @packages/${results.packageName}\n\n${results.description}`,
    ),
  ])

  await Promise.all([
    fs.writeFile(
      path.join(newDir, 'index.js'),
      dedent`
        if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
          require('@packages/ts/register')
        }
        
        module.exports = require('./src')
      `,
    ),
    fs.writeFile(
      path.join(newDir, 'src/index.ts'),
      `export * from './${results.packageName}'`,
    ),
    fs.writeFile(
      path.join(newDir, `src/${results.packageName}.ts`),
      `export const stubPackage = {}`,
    ),
    ...(results.scaffoldTests ? [
      fs.writeFile(
        path.join(newDir, `test/.mocharc.js`),
        'module.exports = {}\n',
      ),
      fs.writeFile(
        path.join(newDir, `test/unit/${results.packageName}.spec.ts`),
        dedent`
          import { expect } from 'chai'

          describe('@packages/${results.packageName} unit', () => {
            it('has a sample test', () => {
              expect(1).to.eq(1)
            })
          })
        `,
      ),
      fs.writeFile(
        path.join(newDir, `test/integration/${results.packageName}.spec.ts`),
        dedent`
          import { expect } from 'chai'

          describe('@packages/${results.packageName} unit', () => {
            it('has a sample test', () => {
              expect(1).to.eq(1)
            })
          })
        `,
      ),
    ] : []),
  ])
}
