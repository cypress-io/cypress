sinon = require('sinon')
require('chai').should()

describe "ECL bin", ->
  beforeEach ->
    @Ecl              = require('../../../lib/ecl')
    @ecl              = new @Ecl

    @displayHelpStub = sinon.stub(@ecl, 'displayHelp')

  it 'should display help when no arguments are passed', ->
    @ecl.parseCliArguments([null, null])

    @displayHelpStub.should
    .have.been.calledOnce
