import sinon, { SinonSpy } from 'sinon'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import mockFs from 'mock-fs'
import { ReactScriptsTemplate } from './react-scripts'
import { snapshotPluginsAstCode } from '../../../test-utils'

use(sinonChai)

describe('create-react-app install template', () => {
  let warnSpy: SinonSpy | null = null

  beforeEach(() => {
    warnSpy = sinon.spy(global.console, 'warn')
  })

  afterEach(() => {
    mockFs.restore()
    warnSpy?.restore()
  })

  it('finds the closest package.json and checks that react-scripts is declared as dependency', () => {
    mockFs({
      '/package.json': JSON.stringify({
        dependencies: {
          'react-scripts': '^3.2.3',
        },
      }),
    })

    const { success } = ReactScriptsTemplate.test(process.cwd())

    expect(success).to.equal(true)
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

    expect(success).to.equal(true)
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

    expect(success).to.equal(false)
    expect(global.console.warn).to.be.called
  })

  it('correctly generates plugins config', () => snapshotPluginsAstCode(ReactScriptsTemplate))
})
