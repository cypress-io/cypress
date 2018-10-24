random = require("randomstring")

id = ->
  ## return a random id
  random.generate({
    length: 5
    capitalization: "lowercase"
  })

module.exports = {
  id
}
