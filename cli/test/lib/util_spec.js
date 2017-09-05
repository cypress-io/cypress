require('../spec_helper')

const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)

describe('util', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.sandbox.stub(logger, 'error')
  })

  it('.exit', function () {
    util.exit(2)
    expect(process.exit).to.be.calledWith(2)

    util.exit(0)
    expect(process.exit).to.be.calledWith(0)
  })

  it('.logErrorExit1', function () {
    const err = new Error('foo')

    util.logErrorExit1(err)

    expect(process.exit).to.be.calledWith(1)
    expect(logger.error).to.be.calledWith('foo')
  })
})
