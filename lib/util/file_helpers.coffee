module.exports = class
  isFileProtocol: (p) ->
    !!p.match(/^file:\/\//g)

  isAbsolute: (p) ->
    !p.match(/:\/\//)

  detectType: (url) ->
    switch
      when @isAbsolute(url)        then "absolute"
      when @isFileProtocol(url)    then "file"
      else "url"
