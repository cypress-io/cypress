import { expect, use } from 'chai'
import sinon, { SinonStub, SinonSpy, SinonSpyCallApi } from 'sinon'
import chalk from 'chalk'
import mockFs from 'mock-fs'
import highlight from 'cli-highlight'
import { main } from './init'
import inquirer from 'inquirer'
import sinonChai from 'sinon-chai'

use(sinonChai)

describe('init script', () => {
  let promptSpy: SinonStub<any> | null = null
  let logSpy: SinonSpy | null = null

  beforeEach(() => {
    logSpy = sinon.spy(global.console, 'log')
  })

  afterEach(() => {
    mockFs.restore()
    logSpy?.restore()
    promptSpy?.restore()
  })

  it('automatically suggests to the user which config to use', async () => {
    mockFs({
      'cypress.json': '{}',
      'webpack.config.js': 'module.exports = { }',
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await main()
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
      'cypress.json': '{}',
      // For next.js user will have babel config, but we want to suggest to use the closest config for the application code
      'babel.config.js': 'module.exports = { }',
      'package.json': JSON.stringify({ dependencies: { next: '^9.2.0' } }),
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'next.js',
      componentFolder: 'src',
    }) as any)

    await main()

    const [{ choices, message }] = (inquirer.prompt as any).args[0][0]

    expect(choices[0]).to.equal('next.js')
    expect(message).to.contain(
      `Press ${chalk.inverse(' Enter ')} to continue with ${chalk.green(
        'next.js',
      )} configuration`,
    )
  })

  it('suggest the right instruction based on user template choice', async () => {
    mockFs({
      'cypress.json': '{}',
    })

    promptSpy = sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'src',
    }) as any)

    await main()
    expect(
      // @ts-ignore
      global.console.log.getCalls().some(
        // Make sure that link to the example of right template was logged
        (spy: SinonSpyCallApi<string[]>) => {
          const call = spy.args[0] || ''

          return call.includes('create-react-app') &&
          call.includes(
            'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts',
          )
        },
      ),
    ).to.equal(true)
  })

  it('suggests right docs example and cypress.json config based on the `componentFolder` answer', async () => {
    mockFs({
      'cypress.json': '{}',
    })

    sinon.stub(inquirer, 'prompt').returns(Promise.resolve({
      chosenTemplateName: 'create-react-app',
      componentFolder: 'cypress/component',
    }) as any)

    await main()

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
