const sh = require('shelljs')
const sinon = require('sinon')
const lintStaged = require('./lint-staged')
const lintChanged = require('./lint-changed')
const lintPrePush = require('./lint-pre-push')
const lintPreCommit = require('./lint-pre-commit')
const chai = require('chai')
const debug = require('debug')('lint.spec')

const { expect } = chai

chai.use(require('sinon-chai'))

const _env = process.env
const _argv = process.argv

const getStagedFiles = () => sh.ShellString('foo.js\nbar.js')
const getUnstagedFiles = () => sh.ShellString('bar.js\nbaz.js')
const getCommittedFiles = () => sh.ShellString('baz.js\nquux.js')

const eslintSuccess = (...args) => {
  debug('eslintSuccess:', args)
  const ret = sh.ShellString(`GOOD JS`)

  ret.exec = sinon.stub().yields(null, 'success')

  return ret
}

const eslintFailure = (...args) => {
  debug('eslintFailure:', args)
  const ret = sh.ShellString(`BAD JS`)

  ret.exec = sinon.stub().yields('foo error')

  return ret
}

beforeEach(() => {
  sinon.stub(sh, 'exec')
  sinon.stub(sh, 'cat')
  sinon.stub(process, 'exit')

  sh.exec
  .withArgs(`git branch`).returns(sh.ShellString('* mybranch'))

  .withArgs(`git diff --name-only --diff-filter=MA --staged`)
  .returns(getStagedFiles())

  .withArgs(`git diff --name-only --diff-filter=M`)
  .returns(getUnstagedFiles())

  .withArgs(`git diff HEAD origin/mybranch --name-only`)
  .returns(getCommittedFiles())

  sh.exec.callsFake(eslintSuccess)
})

describe('lint-staged', () => {
  it('lint success', async () => {
    await lintStaged.start()
    expect(process.exit).not.calledOnce
  })

  it('lint failures', async () => {
    sh.exec.callsFake(eslintFailure)

    await lintStaged.start()
    expect(process.exit).calledOnce
  })
})

describe('lint-changed', () => {
  const filenames = 'bar.js baz.js foo.js'

  beforeEach(() => {
    sh.exec
    .withArgs(`./node_modules/.bin/eslint --color=true '' ${filenames}`)
    .yields(null, 'success')
  })

  it('lint success', async () => {
    await lintChanged.start()
    expect(process.exit).not.calledOnce
  })

  it('lint failures', async () => {
    sh.exec
    .withArgs(`./node_modules/.bin/eslint --color=true '' ${filenames}`)
    .yields('foo error')

    await lintChanged.start()
    expect(process.exit).calledOnce
  })

  it('lint with --fix', async () => {
    process.argv = ['_', '_', '--fix']
    sh.exec
    .withArgs(`./node_modules/.bin/eslint --color=true --fix '' ${filenames}`)
    .yields(null, 'success')

    await lintChanged.start()
    expect(process.exit).not.calledOnce
  })
})

describe('lint-pre-push', () => {
  beforeEach(() => {
    process.env.HUSKY_GIT_PARAMS = 'origin git@github.com:cypress-io/cypress.git'
  })

  it('lint success', async () => {
    await lintPrePush.start()
    expect(process.exit).not.calledOnce
  })

  it('lint failures', async () => {
    sh.exec.callsFake(eslintFailure)

    await lintPrePush.start()
    expect(process.exit).calledOnce
  })
})

describe('lint-pre-commit', () => {
  beforeEach(() => {
    sh.exec
    .withArgs(`./node_modules/.bin/eslint --color=true --fix '' foo.js`)
    .yields(null, 'success')
  })

  it('lint success', async () => {
    await lintPreCommit.start()
    expect(process.exit).not.calledOnce

    expect(sh.exec.withArgs('git add foo.js')).calledOnce
  })

  it('lint failures', async () => {
    sh.exec.callsFake(eslintFailure)

    await lintPreCommit.start()
    expect(process.exit).calledOnce
  })
})

afterEach(() => {
  process.argv = _argv
  process.env = _env
  sinon.restore()
})

// sinon.addBehavior('withArgIncludes', (stub, str) => {

// })

// function withArgsInclude() {
//   this.
//   .callsFake((...args) => {
//     args[0].includes()

//   })
// }
