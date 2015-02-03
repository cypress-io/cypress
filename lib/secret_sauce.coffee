SecretSauce =
  mixin: (module, klass) ->
    for key, fn of @[module]
      klass.prototype[key] = fn

SecretSauce.Keys =
  _convertToId: (index) ->
    ival = index.toString(36)
    ## 0 pad number to ensure three digits
    [0,0,0].slice(ival.length).join("") + ival

  _getProjectKeyRange: (id) ->
    @cache.getProject(id).get("RANGE")

  ## Lookup the next Test integer and update
  ## offline location of sync
  getNextTestNumber: (projectId) ->
    @_getProjectKeyRange(projectId)
    .then (range) =>
      return @_getNewKeyRange(projectId) if range.start is range.end

      range.start += 1
      range
    .then (range) =>
      range = JSON.parse(range) if SecretSauce._.isString(range)
      @cache.updateRange(projectId, range)
      .return(range.start)

  nextKey: ->
    @project.ensureProjectId().bind(@)
    .then (projectId) ->
      @cache.ensureExists().bind(@)
      .then -> @cache.ensureProject(projectId)
      .then -> @getNextTestNumber(projectId)
      .then @_convertToId
module?.exports = SecretSauce