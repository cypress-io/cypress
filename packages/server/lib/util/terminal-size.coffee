termSize = require("term-size")
env = require("./env")

get = ->
  obj = termSize()

  if env.get("CI")
    ## reset to 100
    obj.columns = 100

  obj

module.exports = {
  get
}
