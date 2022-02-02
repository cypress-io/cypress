const logger = require(`../../lib/logger`)
const chalk = require('chalk')
const errors = require('../../lib/errors')

context('.logException', () => {
  it('calls logger.createException with unknown error', () => {
    sinon.stub(logger, 'createException').resolves()
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('production')

    const err = new Error('foo')

    return errors.logException(err)
    .then(() => {
      expect(console.log).to.be.calledWith(chalk.red(err.stack))

      expect(logger.createException).to.be.calledWith(err)
    })
  })

  it('does not call logger.createException when known error', () => {
    sinon.stub(logger, 'createException').resolves()
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('production')

    const err = errors.getError('NOT_LOGGED_IN')

    return errors.logException(err)
    .then(() => {
      expect(console.log).not.to.be.calledWith(err.stack)

      expect(logger.createException).not.to.be.called
    })
  })

  it('does not call logger.createException when not in production env', () => {
    sinon.stub(logger, 'createException').resolves()
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('development')

    const err = new Error('foo')

    return errors.logException(err)
    .then(() => {
      expect(console.log).not.to.be.calledWith(err.stack)

      expect(logger.createException).not.to.be.called
    })
  })

  it('swallows creating exception errors', () => {
    sinon.stub(logger, 'createException').rejects(new Error('foo'))
    sinon.stub(process.env, 'CYPRESS_INTERNAL_ENV').value('production')

    const err = errors.getError('NOT_LOGGED_IN')

    return errors.logException(err)
    .then((ret) => {
      expect(ret).to.be.undefined
    })
  })
})
