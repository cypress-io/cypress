set = (key, val) ->
  process.env[key] = val

get = (key) ->
  process.env[key]

module.exports = {
  set

  get
}
