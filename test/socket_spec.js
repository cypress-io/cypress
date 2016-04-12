var fs     = require("fs")
var server = require("socket.io")
var client = require("socket.io-client")
var clientSrc = require.resolve("socket.io-client")
var expect = require("chai").expect
var lib    = require("../index")

describe("Socket", function(){
  it("exports server", function(){
    expect(lib.server).to.eq(server)
  })

  it("exports client", function(){
    expect(lib.client).to.eq(client)
  })

  context(".getPathToClientSource", function(){
    it("returns path to socket.io.js", function(){
      var p = process.cwd() + "/node_modules/socket.io-client/socket.io.js"
      expect(lib.getPathToClientSource()).to.eq(p)
    })

    it("makes sure socket.io.js actually exists", function(done){
      fs.stat(lib.getPathToClientSource(), done)
    })
  })
})