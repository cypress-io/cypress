import { mockFs, clearMockedFs } from '../test/mockFs'
import { ReactScriptsTemplate } from './react-scripts'

jest.spyOn(global.console, 'warn')

describe('create-react-app install template', () => {
  beforeEach(clearMockedFs)

  it('finds the closest package.json and checks that react-scripts is declared as dependency', () => {
    mockFs({
      'package.json': JSON.stringify({
        dependencies: {
          'react-scripts': '^3.2.3',
        },
      }),
    })

    const { success } = ReactScriptsTemplate.test(process.cwd())
    expect(success).toBe(true)
  })

  it('works if react-scripts is declared in the devDependencies as well', () => {
    mockFs({
      './package.json': JSON.stringify({
        devDependencies: {
          'react-scripts': '^3.2.3',
        },
      }),
    })

    const { success } = ReactScriptsTemplate.test(process.cwd())
    expect(success).toBe(true)
  })

  it('warns and fails if version is not supported', () => {
    mockFs({
      './package.json': JSON.stringify({
        devDependencies: {
          'react-scripts': '^2.2.3',
        },
      }),
    })

    const { success } = ReactScriptsTemplate.test(process.cwd())

    expect(success).toBe(false)
    expect(global.console.warn).toBeCalled()
  })
})
