import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs-extra'
import prettier from 'prettier'
import _ from 'lodash'

import { monorepoPaths } from '../monorepoPaths'
import execa from 'execa'

export async function makeSystemTest () {
  const results = await inquirer.prompt<{
    systemTestName: string
    target: Array<'component' | 'e2e'>
    dependencies: string
    addTsconfig: boolean
  }>([
    {
      name: 'systemTestName',
      type: 'input',
      message: 'What is the system test directory name?',
      validate: (val) => /[a-z\-]+/.test(val),
    },
    {
      name: 'target',
      type: 'checkbox',
      choices: ['component', 'e2e'],
      message: 'Where is the package targeting',
    },
    {
      name: 'dependencies',
      type: 'input',
      message: 'Dependencies to add to the package.json / yarn',
    },
    {
      name: 'addTsconfig',
      type: 'confirm',
      default: false,
      message: 'Add TSConfig to the project?',
    },
  ])

  const hasCT = results.target.includes('component')
  const hasE2E = results.target.includes('component')

  type ComponentResult = {
    bundler: 'vite' | 'webpack'
    framework: 'react' | 'vue' | 'nextjs' | 'nuxtjs'
  }

  let componentResult: ComponentResult | undefined = undefined

  if (results.target.includes('component')) {
    componentResult = await inquirer.prompt<ComponentResult>([
      {
        name: 'bundler',
        type: 'list',
        message: 'Bundler for the component tests',
        choices: ['vite', 'webpack'],
      },
      {
        name: 'framework',
        type: 'list',
        message: 'Framework to pair with the bundler for component tests',
        choices: (answers) => {
          if (answers.bundler === 'vite') {
            return ['vue', 'react']
          }

          if (answers.bundler === 'webpack') {
            return ['react', 'react-scripts', 'vue', 'nextjs', 'nuxtjs']
          }
        },
      },
    ])
  }

  let packageJsonAdditions: Record<string, any> = {}
  const devDependencies = {
    'cypress': 'file:../../../cli',
  }

  const newDir = path.join(monorepoPaths.systemTestsDir, 'projects', results.systemTestName)

  if (fs.existsSync(newDir)) {
    throw new Error(`${newDir} already exists!`)
  }

  await fs.ensureDir(path.join(newDir, 'cypress/support'))

  const toPrint: Record<string, any> = {}

  if (hasE2E) {
    await Promise.all([
      fs.ensureDir(path.join(newDir, 'cypress/e2e')),
      fs.ensureDir(path.join(newDir, 'cypress/support')),
    ])
  }

  if (hasE2E || hasCT) {
    if (hasE2E) {
      toPrint['e2e'] = {}
    }

    if (hasCT) {
      toPrint['component'] = {
        devServer: {
          framework: componentResult?.framework,
          bundler: componentResult?.bundler,
        },
      }

      if (componentResult?.framework === 'nextjs') {
        packageJsonAdditions.scripts = {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'lint': 'next lint',
        }
      }
    }

    await fs.writeFile(path.join(newDir, `cypress.config.${results.addTsconfig ? 'ts' : 'js'}`), prettier.format(`
      ${results.addTsconfig ? `import {defineConfig} from 'cypress'` : `const {defineConfig} = require('cypress')`}
  
      ${results.addTsconfig ? `export default` : 'module.exports ='} defineConfig(${JSON.stringify(toPrint, null, 2)}) 
    
    `, { parser: 'typescript' }))
  }

  if (results.addTsconfig) {
    await fs.writeFile(
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
    )
  }

  if (results.dependencies.length) {
    await fs.writeFile(
      path.join(newDir, 'package.json'),
      JSON.stringify(
        {
          version: '0.0.0-development',
          devDependencies,
          ...packageJsonAdditions,
        },
        null,
        2,
      ),
    )

    await execa('yarn', ['add', ...results.dependencies.split(' ')], {
      cwd: newDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        CYPRESS_INSTALL_BINARY: '0',
      },
    })
  }

  if (componentResult?.framework === 'nextjs') {
    await fs.writeFile(
      path.join(newDir, 'pages/index.js'),
      format(`
        function HomePage() {
          return <div>Welcome to Next.js!</div>
        }
        export default HomePage
      `),
    )
  }

  const specName = _.snakeCase(results.systemTestName)

  fs.writeFile(
    path.join(monorepoPaths.systemTestsDir, 'test', `${specName}_spec.js`),
    format(`
      const systemTests = require('../lib/system-tests').default

      describe('${specName} specs', () => {
        systemTests.setup()

        ${hasCT ? `
          it('executes the component test specs in the directory', function () {
            return systemTests.exec(this, {
              project: '${specName}',
              snapshot: true,
              expectedExitCode: 0,
              testingType: 'component'
            })
          })
        ` : ''}

        ${hasE2E ? `
          it('executes the e2e test specs in the directory', function () {
            return systemTests.exec(this, {
              project: '${specName}',
              snapshot: true,
              expectedExitCode: 0,
              testingType: 'e2e'
            })
          })
        ` : ''}        
      })
    `),
  )
  //
}

function format (val: string) {
  return prettier.format(val, {
    parser: 'typescript',
  })
}
