module.exports =
  isFileProtocol: (p) ->
    p.match(/^file:\/\//g)

  isRelativeRequest: (p) ->
    !p.match(/:\/\//)
