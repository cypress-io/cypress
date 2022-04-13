import path from 'path'
import fs from 'fs-extra'
import snapshot from 'snap-shot-it'
import { expect, use } from 'chai'
import sinon, { SinonStub, SinonSpy } from 'sinon'
import chalk from 'chalk'
import mockFs from 'mock-fs'
import { initComponentTesting } from './init-component-testing'
import inquirer from 'inquirer'
import sinonChai from 'sinon-chai'
import childProcess from 'child_process'
import { someOfSpyCallsIncludes } from '../test-utils'

use(sinonChai)

describe('init component tests script', () => {
  let promptSpy: SinonStub<any> | null = null
  let logSpy: SinonSpy | null = null
  let processExitStub: SinonStub<any> | null = null
  let execStub: SinonStub | null = null

  const e2eTestOutputPath = path.resolve(__dirname, '..', 'test-output')
  const cypressConfigPath = path.join(e2eTestOutputPath, 'cypress.config.ts')

  beforeEach(async () => {
    logSpy = sinon.spy(global.console, 'log')
    // @ts-ignores
    execStub = sinon.stub(childProcess, 'exec').callsFake((command, callback) => callback())
    processExitStub = sinon.stub(process, 'exit').callsFake(() => {
      throw new Error(`${chalk.red('process.exit')} should not be called`)
    })

    await fs.remove(e2eTestOutputPath)
    await fs.mkdir(e2eTestOutputPath)

    process.env.BABEL_TEST_ROOT = e2eTestOutputPath
  })

  afterEach(() => {
    mockFs.restore()
    logSpy?.restore()
    promptSpy?.restore()
    processExitStub?.restore()
    execStub?.restore()
  })

  function createTempFiles (tempFiles: Record<string, string>) {
    Object.entries(tempFiles).forEach(([fileName, content]) => {
      fs.outputFileSync(
        path.join(e2eTestOutputPath, fileName),
        content,
      )
    })
  }

  function snapshotGeneratedFiles (name: string) {
    snapshot(
      `${name} cypress.config.ts`,
      fs.readFileSync(
        path.join(e2eTestOutputPath, 'cypress.config.ts'),
        { encoding: 'utf-8' },
      ),
    )

    snapshot(
      `${name} plugins/index.js`,
      fs.readFileSync(
        path.join(e2eTestOutputPath, 'cypress', 'plugins', 'index.js'),
        { encoding: 'utf-8' },
      ),
    )

    const supportFile = fs.readFileSync(
      path.join(e2eTestOutputPath, 'cypress', 'support', 'component.js'),
      { encoding: 'utf-8' },
    )

    // Comparing empty snapshot errors.
    if (supportFile.length === 0) {
      return
    }

    snapshot(
      `${name} support/component.js`,
      fs.readFileSync(
        path.join(e2eTestOutputPath, 'cypress', 'support', 'component.js'),
        { encoding: 'utf-8' },
      ),
    )
  }

  it('determines more presumable configuration to suggest', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/cypress/support/component.js': '',
      '/cypress/plugins/index.js': 'module.exports = (on, config) => {}',
      // For next.js user will have babel config, but we want to suggest to use the closest config for the application code
      '/babel.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { react: '^17.x', next: '^9.2.0' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'next.js',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })

    const [{ choices }] = (inquirer.prompt as any).args[0][0]

    expect(choices[0]).to.equal('next.js')
    snapshotGeneratedFiles('injects guessed next.js template')
  })

  it('automatically suggests to the user which config to use', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/cypress/support/component.js': 'import "./commands.js";',
      '/cypress/plugins/index.js': 'module.exports = () => {}',
      '/package.json': JSON.stringify({
        dependencies: {
          react: '^16.10.0',
        },
      }),
      '/webpack.config.js': 'module.exports = { }',
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })
    const [{ choices, message }] = (inquirer.prompt as any).args[0][0]

    expect(choices[0]).to.equal('webpack')
    expect(message).to.contain(
      `Press ${chalk.inverse(' Enter ')} to continue with ${chalk.green(
        'webpack',
      )} configuration`,
    )

    snapshotGeneratedFiles('Injected overridden webpack template')
  })

  it('Asks for preferred bundling tool if can not determine the right one', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/webpack.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt')
    .onCall(0)
    .returns(Promise.resolve({
      framework: 'vue@2',
    }) as any)
    .onCall(1)
    .returns(Promise.resolve({
      chosenTemplateName: 'webpack',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })

    expect(
      someOfSpyCallsIncludes(global.console.log, 'We were unable to automatically determine your framework 😿'),
    ).to.be.true
  })

  it('Asks for framework if more than 1 option was auto detected', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/webpack.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { react: '*', vue: '^2.4.5' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt')
    .onCall(0)
    .returns(Promise.resolve({
      framework: 'vue@3',
    }) as any)
    .onCall(1)
    .returns(Promise.resolve({
      chosenTemplateName: 'webpack',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })

    expect(
      someOfSpyCallsIncludes(global.console.log, `It looks like all these frameworks: ${chalk.yellow('react, vue@2')} are available from this directory.`),
    ).to.be.true
  })

  it('installs the right adapter', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/webpack.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { react: '16.4.5' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt')
    .onCall(0)
    .returns(Promise.resolve({
      chosenTemplateName: 'vite',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })
    expect(execStub).to.be.calledWith('yarn add @cypress/react --dev')
  })

  it('installs the right adapter for vue 3', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/vite.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { vue: '^3.0.0' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt')
    .onCall(0)
    .returns(Promise.resolve({
      chosenTemplateName: 'vite',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })
    expect(execStub).to.be.calledWith('yarn add @cypress/vue --dev')
  })

  it('suggest the right instruction based on user template choice', async () => {
    createTempFiles({
      '/package.json': JSON.stringify({
        dependencies: {
          react: '^16.0.0',
        },
      }),
      '/cypress.config.ts': 'export default {}',
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })
    expect(
      someOfSpyCallsIncludes(
        global.console.log,
        'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts',
      ),
    ).to.be.true
  })

  it('suggests right docs example and cypress.config.ts config based on the `componentFolder` answer', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/package.json': JSON.stringify({
        dependencies: {
          react: '^16.0.0',
        },
      }),
    })

    sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })

    const injectedCode = require(path.join(e2eTestOutputPath, 'cypress.config.ts'))

    expect(JSON.stringify(injectedCode.default, null, 2)).to.equal(JSON.stringify(
      {
        specPattern: 'cypress/component/**/*.spec.{js,ts,jsx,tsx}',
      },
      null,
      2,
    ))
  })

  it('Shows help message if cypress files are not created', async () => {
    createTempFiles({
      '/cypress.config.ts': 'export default {}',
      '/package.json': JSON.stringify({
        dependencies: {
          react: '^16.0.0',
        },
      }),
    })

    sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })

    expect(
      someOfSpyCallsIncludes(
        global.console.log,
        'was not updated automatically. Please add the following config manually:',
      ),
    ).to.be.true
  })

  it(`Doesn't affect injected code if user has custom babel.config.js`, async () => {
    createTempFiles({
      '/cypress/plugins/index.js': 'module.exports = (on, config) => {}',
      '/cypress.config.ts': 'export default {}',
      'babel.config.js': `module.exports = ${JSON.stringify({
        presets: [
          '@babel/preset-env',
        ],
      })}`,
      '/package.json': JSON.stringify({
        dependencies: {
          babel: '*',
          react: '^16.0.0',
        },
      }),
    })

    sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await initComponentTesting({ config: {}, cypressConfigPath, useYarn: true })
    const babelPluginsOutput = await fs.readFile(
      path.join(e2eTestOutputPath, 'cypress', 'plugins', 'index.js'),
      'utf-8',
    )

    expect(babelPluginsOutput).not.to.contain('use strict')
    expect(babelPluginsOutput).to.contain('module.exports = (on, config) => {')
  })
})
