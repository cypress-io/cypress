import sinon, { SinonSpy } from 'sinon'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import mockFs from 'mock-fs'
import { NextTemplate } from './next'
import { snapshotPluginsAstCode } from '../../../test-utils'

use(sinonChai)

describe('next.js install template', () => {
  let warnSpy: SinonSpy | null = null

  beforeEach(() => {
    warnSpy = sinon.spy(global.console, 'warn')
  })

  afterEach(() => {
    mockFs.restore()
    warnSpy?.restore()
  })

  it('finds the closest package.json and checks that next is declared as dependency', () => {
    mockFs({
      '/package.json': JSON.stringify({
        dependencies: {
          next: '^9.2.3',
        },
        scripts: {
          build: 'next',
        },
      }),
    })

    const { success } = NextTemplate.test('/')

    expect(success).to.equal(true)
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

    expect(success).to.equal(true)
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

    console.log(global.console.warn)
    expect(success).to.equal(false)

    expect(global.console.warn).to.be.called
  })

  it('correctly generates plugins config', () => snapshotPluginsAstCode(NextTemplate))
})
