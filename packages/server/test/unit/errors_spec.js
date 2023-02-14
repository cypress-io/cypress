/* eslint-disable no-console */
require('../spec_helper')

const exception = require(`../../lib/cloud/exception`)
const chalk = require('chalk')
const errors = require('../../lib/errors')

context('.logException', () => {
  beforeEach(() => {
    sinon.stub(console, 'log')
  })

  it('calls exception.create with unknown error', () => {
    sinon.stub(exception, 'create').resolves()
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('production')

    const err = new Error('foo')

    return errors.logException(err)
    .then(() => {
      expect(console.log).to.be.calledWith(chalk.red(err.stack ?? ''))

      expect(exception.create).to.be.calledWith(err)
    })
  })

  it('does not call exception.create when known error', () => {
    sinon.stub(exception, 'create').resolves()
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('production')

    const err = errors.get('NOT_LOGGED_IN')

    return errors.logException(err)
    .then(() => {
      expect(console.log).not.to.be.calledWith(err.stack)

      expect(exception.create).not.to.be.called
    })
  })

  it('does not call exception.create when not in production env', () => {
    sinon.stub(exception, 'create').resolves()
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('development')

    const err = new Error('foo')

    return errors.logException(err)
    .then(() => {
      expect(console.log).not.to.be.calledWith(err.stack)

      expect(exception.create).not.to.be.called
    })
  })

  it('swallows creating exception errors', () => {
    sinon.stub(exception, 'create').rejects(new Error('foo'))
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('production')

    const err = errors.get('NOT_LOGGED_IN')

    return errors.logException(err)
    .then((ret) => {
      expect(ret).to.be.undefined
    })
  })
})
