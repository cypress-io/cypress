import { expect, use } from 'chai'
import sinon, { SinonStub, SinonSpy, SinonSpyCallApi } from 'sinon'
import chalk from 'chalk'
import mockFs from 'mock-fs'
import highlight from 'cli-highlight'
import { initComponentTesting } from './init-component-testing'
import inquirer from 'inquirer'
import sinonChai from 'sinon-chai'

use(sinonChai)

function someOfSpyCallsIncludes (spy: any, logPart: string) {
  return spy.getCalls().some(
    (spy: SinonSpyCallApi<unknown[]>) => {
      return spy.args.some((callArg) => typeof callArg === 'string' && callArg.includes(logPart))
    },
  )
}

describe('init script', () => {
  let promptSpy: SinonStub<any> | null = null
  let logSpy: SinonSpy | null = null
  let processExitStub: SinonStub<any> | null = null

  beforeEach(() => {
    logSpy = sinon.spy(global.console, 'log')
    processExitStub = sinon.stub(process, 'exit').callsFake(() => {
      throw new Error(`${chalk.red('process.exit')} should not be called`)
    })
  })

  afterEach(() => {
    mockFs.restore()
    logSpy?.restore()
    promptSpy?.restore()
    processExitStub?.restore()
  })

  it('automatically suggests to the user which config to use', async () => {
    mockFs({
      '/cypress.json': '{}',
      '/package.json': JSON.stringify({
        dependencies: {
          react: '^16.10.0',
        },
      }),
      '/webpack.config.js': 'module.exports = { }',
    }, { createCwd: true })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await initComponentTesting()
    const [{ choices, message }] = (inquirer.prompt as any).args[0][0]

    expect(choices[0]).to.equal('webpack')
    expect(message).to.contain(
      `Press ${chalk.inverse(' Enter ')} to continue with ${chalk.green(
        'webpack',
      )} configuration`,
    )
  })

  it('determines more presumable configuration to suggest', async () => {
    mockFs({
      '/cypress.json': '{}',
      // For next.js user will have babel config, but we want to suggest to use the closest config for the application code
      '/babel.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { react: '^17.x', next: '^9.2.0' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'next.js',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting()

    const [{ choices, message }] = (inquirer.prompt as any).args[0][0]

    expect(choices[0]).to.equal('next.js')
    expect(message).to.contain(
      `Press ${chalk.inverse(' Enter ')} to continue with ${chalk.green(
        'next.js',
      )} configuration`,
    )
  })

  it('Asks for framework if can not determine the right one', async () => {
    mockFs({
      '/cypress.json': '{}',
      '/webpack.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt')
    .onCall(0)
    .returns(Promise.resolve({
      framework: 'vue',
    }) as any)
    .onCall(1)
    .returns(Promise.resolve({
      chosenTemplateName: 'webpack',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting()

    expect(
      someOfSpyCallsIncludes(global.console.log, 'We were unable to automatically determine your framework 😿'),
    ).to.be.true
  })

  it('Asks for framework if more than 1 option was auto detected', async () => {
    mockFs({
      '/cypress.json': '{}',
      '/webpack.config.js': 'module.exports = { }',
      '/package.json': JSON.stringify({ dependencies: { react: '*', vue: '*' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt')
    .onCall(0)
    .returns(Promise.resolve({
      framework: 'vue',
    }) as any)
    .onCall(1)
    .returns(Promise.resolve({
      chosenTemplateName: 'webpack',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting()

    expect(
      someOfSpyCallsIncludes(global.console.log, `It looks like all these frameworks: ${chalk.yellow('react, vue')} are available from this directory.`),
    ).to.be.true
  })

  it('suggest the right instruction based on user template choice', async () => {
    mockFs({
      '/package.json': JSON.stringify({
        dependencies: {
          react: '^16.0.0',
        },
      }),
      '/cypress.json': '{}',
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'src',
    }) as any)

    await initComponentTesting()
    expect(
      someOfSpyCallsIncludes(global.console.log, 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts'),
    ).to.be.true
  })

  it('suggests right docs example and cypress.json config based on the `componentFolder` answer', async () => {
    mockFs({
      '/cypress.json': '{}',
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

    await initComponentTesting()

    const expectedCode = highlight(
      JSON.stringify(
        {
          experimentalComponentTesting: true,
          componentFolder: 'cypress/component',
          testFiles: '**/*.spec.{js,ts,jsx,tsx}',
        },
        null,
        2,
      ),
      { language: 'json' },
    )

    expect(global.console.log).to.be.calledWith(`\n${expectedCode}\n`)
  })
})
