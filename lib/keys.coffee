_        = require 'lodash'
Promise  = require 'bluebird'
alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

getRandom = (alphabet) ->
  index = Math.floor(Math.random() * alphabet.length)
  alphabet[index]

module.exports =
  getNew:  ->
    new Promise (resolve, reject) ->
      resolve(
        _(3).times(-> getRandom(alphabet)).value().join("")
      )
