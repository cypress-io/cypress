import chalk from 'chalk'
import highlight from 'cli-highlight'
import { main, guessTemplateForUsedFramework } from './init'
import inquirer from 'inquirer'
import { mockFs, clearMockedFs } from './test/mockFs'

jest.mock('fs')
jest.mock('inquirer')
jest.spyOn(global.console, 'log')

describe('end-to-end tests for init script', () => {
  beforeEach(clearMockedFs)
  afterEach(() => jest.clearAllMocks())

  it('automatically suggests to the user which config to use', async () => {
    mockFs({
      'cypress.json': '{}',
      'webpack.config.js': 'module.exports = { }',
    })

    // @ts-ignore
    inquirer.prompt = jest.fn(() =>
      Promise.resolve({
        chosenTemplateName: 'create-react-app',
        componentFolder: 'cypress/component',
      }),
    )

    await main()

    const [{ choices, message }] = (inquirer.prompt as any).mock.calls[0][0]

    expect(choices[0]).toBe('webpack')
    expect(message).toContain(
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

    // @ts-ignore
    inquirer.prompt = jest.fn(() =>
      Promise.resolve({
        chosenTemplateName: 'next.js',
        componentFolder: 'src',
      }),
    )

    await main()

    const [{ choices, message }] = (inquirer.prompt as any).mock.calls[0][0]

    expect(choices[0]).toBe('next.js')
    expect(message).toContain(
      `Press ${chalk.inverse(' Enter ')} to continue with ${chalk.green(
        'next.js',
      )} configuration`,
    )
  })

  it('suggest the right instruction based on user template choice', async () => {
    mockFs({
      'cypress.json': '{}',
    })

    // @ts-ignore
    inquirer.prompt = jest.fn(() =>
      Promise.resolve({
        chosenTemplateName: 'create-react-app',
        componentFolder: 'src',
      }),
    )

    await main()

    expect(
      // @ts-ignore
      global.console.log.mock.calls.some(
        ([call]: string[]) =>
          // Make sure that link to the example of right template was logged
          call.includes('create-react-app') &&
          call.includes(
            'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/react-scripts',
          ),
      ),
    ).toBe(true)
  })

  it('suggests right docs example and cypress.json config based on the `componentFolder` answer', async () => {
    mockFs({
      'cypress.json': '{}',
    })

    // @ts-ignore
    inquirer.prompt = jest.fn(() =>
      Promise.resolve({
        chosenTemplateName: 'create-react-app',
        componentFolder: 'cypress/component',
      }),
    )

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

    expect(global.console.log).toBeCalledWith(`\n${expectedCode}\n`)
  })
})
