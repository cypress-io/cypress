req = (win) ->
  new Promise (resolve, reject) ->
    rand = Math.random()

    xhr = new win.XMLHttpRequest()
    xhr.open("GET", "http://localhost:1515/cached/")
    xhr.onload = -> resolve(win)
    xhr.onerror = reject
    xhr.send()

it "makes cached request", ->
  cy
    .visit("http://localhost:1515")
    .then(req) ## this creates the disk cache
    .then(req) ## this should not hit our server
