module.exports = class
  isFileProtocol: (p) ->
    !!p.match(/^file:\/\//g)

  isRelativeRequest: (p) ->
    !p.match(/:\/\//)

  detectType: (url) ->
    switch
      when @isRelativeRequest(url) then "relative"
      when @isFileProtocol(url)    then "file"
      else "url"
