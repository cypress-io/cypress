import { mockFs, clearMockedFs } from '../test/mockFs'
import { NextTemplate } from './next'

jest.spyOn(global.console, 'warn')

describe.only('next.js install template', () => {
  beforeEach(clearMockedFs)

  it('finds the closest package.json and checks that next is declared as dependency', () => {
    mockFs({
      'package.json': JSON.stringify({
        dependencies: {
          next: '^9.2.3',
        },
        scripts: {
          build: 'next',
        },
      }),
    })

    const { success } = NextTemplate.test('/')
    expect(success).toBe(true)
  })

  it('works if next is declared in the devDependencies as well', () => {
    mockFs({
      './package.json': JSON.stringify({
        devDependencies: {
          next: '^9.2.3',
        },
        scripts: {
          build: 'next',
        },
      }),
    })

    const { success } = NextTemplate.test(process.cwd())
    expect(success).toBe(true)
  })

  it('warns and fails if version is not supported', () => {
    mockFs({
      './package.json': JSON.stringify({
        devDependencies: {
          next: '^8.2.3',
        },
        scripts: {
          build: 'next',
        },
      }),
    })

    const { success } = NextTemplate.test('i/am/in/some/deep/folder')

    expect(success).toBe(false)
    expect(global.console.warn).toBeCalled()
  })
})
