currentPath = null

module.exports = {
  reset: ->
    currentPath = null

  version: ->

  path: ->
    if currentPath
      return Promise.resolve(currentPath)

    util.find("com.google.Chrome")
    .then (p) ->
      currentPath = p

  get: ->
    Promise.props({
      path: @path()
      version: @version()
    })
}