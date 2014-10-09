sinon         = require('sinon')
remoteLoader  = require('../../../lib/controllers/remote_loader')

chai = require('chai')
chai.use(require("chai-as-promised"))

describe "Remote Loader", ->
  it 'should inject content', ->
    remoteLoader::injectContent("<body></body>", "wow")
    .should.eventually.eql("<body>wow </body>")
