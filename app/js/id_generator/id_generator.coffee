do ($, _, io) ->
  testIdRegExp  = /\[(.{3})\]$/

  run           = Mocha.prototype.run

  channel       = io.connect()
  channel.on "generate:ids:for:test", (filePath, strippedPath) ->
    $("iframe").remove()

    iframe = $("<iframe>", {
      src: "/iframes/" + strippedPath
      load: ->
        mocha = @contentWindow.mocha
        @contentWindow.Mocha.prototype.run.call mocha, filePath, channel, ->
          channel.emit("finished:generating:ids:for:test", strippedPath)
    })

    iframe.appendTo $("body")

  Mocha.prototype.run = (spec, channel, fn) ->
    dfs = []

    iterateThroughRunnables(@suite, spec, channel, dfs)

    $.when(dfs...).done fn

  iterateThroughRunnables = (runnable, spec, channel, dfs) ->
    _.each [runnable.tests, runnable.suites], (array) =>
      _.each array, (item) =>
        generateId item, spec, channel, dfs

  generateId = (runnable, spec, channel, dfs) ->
    return if runnable.root

    runnable.cid ?= getTestCid(runnable)

    if not runnable.cid
      df = $.Deferred()

      data = {title: runnable.title, spec: spec}
      channel.emit "generate:test:id", data, (id) ->
        ## an error occured if its an object
        if _.isObject(id)
          df.reject id.message
        else
          runnable.cid = id
          df.resolve id

      dfs.push df

    iterateThroughRunnables(runnable, spec, channel, dfs)

  getTestCid = (test) ->
    ## grab the test id from the test's title
    matches = testIdRegExp.exec(test.title)

    ## use the captured group if there was a match
    matches and matches[1]