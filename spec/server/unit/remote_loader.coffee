sinon         = require('sinon')
remoteLoader  = require('../../../lib/controllers/remote_loader')

chai = require('chai')
chai.use(require("chai-as-promised"))

describe "Remote Loader", ->
  it 'should inject content', ->
    remoteLoader::injectContent("<head></head><body></body>", "wow")
    .should.eventually.eql("<head> wow</head><body></body>")
