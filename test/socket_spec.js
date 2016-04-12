var server = require("socket.io")
var client = require("socket.io-client")
var expect = require("chai").expect
var lib    = require("../index")

describe("Socket", function(){
  it("exports server", function(){
    expect(lib.server).to.eq(server)
  })

  it("exports client", function(){
    expect(lib.client).to.eq(client)
  })
})