require('../spec_helper')

const Promise = require('bluebird')
const pkg = require('@packages/root')
const { fs } = require(`../../lib/util/fs`)
const mockedEnv = require('mocked-env')
const { app } = require('electron')

const setEnv = (env) => {
  process.env['CYPRESS_INTERNAL_ENV'] = env

  return expectedEnv(env)
}

const expectedEnv = function (env) {
  require(`../../lib/environment`)

  expect(process.env['CYPRESS_INTERNAL_ENV']).to.eq(env)
}

const setPkg = (env) => {
  pkg.env = env

  return expectedEnv(env)
}

const env = process.env['CYPRESS_INTERNAL_ENV']

describe('lib/environment', () => {
  beforeEach(() => {
    sinon.stub(Promise, 'config')
    delete process.env['CYPRESS_INTERNAL_ENV']

    return delete require.cache[require.resolve(`../../lib/environment`)]
  })

  afterEach(() => {
    delete require.cache[require.resolve(`../../lib/environment`)]

    return delete process.env['CYPRESS_INTERNAL_ENV']
  })

  after(() => {
    return process.env['CYPRESS_INTERNAL_ENV'] = env
  })

  context('parses ELECTRON_EXTRA_LAUNCH_ARGS', () => {
    let restore = null

    it('sets launch args', () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: '--foo --bar=baz --quux=true',
      })

      sinon.stub(app.commandLine, 'appendSwitch')
      require(`../../lib/environment`)
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--bar', 'baz')

      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--quux', 'true')
    })

    it('sets launch args with zero', () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: '--foo --bar=baz --quux=0',
      })

      sinon.stub(app.commandLine, 'appendSwitch')
      require(`../../lib/environment`)
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--bar', 'baz')

      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--quux', '0')
    })

    it('sets launch args with false', () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: '--foo --bar=baz --quux=false',
      })

      sinon.stub(app.commandLine, 'appendSwitch')
      require(`../../lib/environment`)
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--bar', 'baz')

      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--quux', 'false')
    })

    it('sets launch args with multiple values inside quotes', () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: `--foo --ipsum=0 --bar=--baz=quux --lorem='--ipsum=dolor --sit=amet'`,
      })

      sinon.stub(app.commandLine, 'appendSwitch')
      require(`../../lib/environment`)

      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--ipsum', '0')
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--bar', '--baz=quux')
      expect(app.commandLine.appendSwitch).to.have.been.calledWith('--lorem', '--ipsum=dolor --sit=amet')
    })

    return afterEach(() => {
      if (restore) {
        return restore()
      }
    })
  })

  context('#existing process.env.CYPRESS_INTERNAL_ENV', () => {
    it('is production', () => {
      return setEnv('production')
    })

    it('is development', () => {
      return setEnv('development')
    })

    it('is staging', () => {
      return setEnv('staging')
    })
  })

  context('uses package.json env', () => {
    afterEach(() => {
      return delete pkg.env
    })

    it('is production', () => {
      return setPkg('production')
    })

    it('is staging', () => {
      return setPkg('staging')
    })

    it('is test', () => {
      return setPkg('test')
    })
  })

  context('it uses development by default', () => {
    beforeEach(() => {
      return sinon.stub(fs, 'readJsonSync').returns({})
    })

    it('is development', () => {
      return expectedEnv('development')
    })
  })

  context('it sets process.env.CYPRESS', () => {
    it('sets CYPRESS=true when Cypress runs', () => {
      expect(process.env['CYPRESS']).to.eq('true')
    })
  })
})
