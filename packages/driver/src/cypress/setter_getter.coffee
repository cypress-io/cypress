_ = require("lodash")

reset = (state = {}) ->
  ## perf loop
  for key, val of state
    delete state[key]

  return state

## a basic object setter / getter class
create = (state = {}) ->
  get = (key) ->
    if key
      state[key]
    else
      state

  set = (key, value) ->
    if _.isObject(key)
      obj = key
      ret = obj
    else
      obj = {}
      obj[key] = value
      ret = value

    ## manually iterate through the
    ## object and set its key/value on
    ## state because using _.extend()
    ## can throw in IE11 because of
    ## internal copyObject function which
    ## reads in the existing values. those
    ## existing values may include references
    ## to values we no longer have access to.
    # window.debugger(2, true, true)
    # _.each obj, (v, k) ->
    #   state[k] = v

    _.extend(state, obj)

    return ret

  ## return the getter / setter function interface
  SetterGetter = (key, value) ->
    switch arguments.length
      when 0
        get()
      when 1
        if _.isString(key)
          get(key)
        else
          set(key)
      else
        set(key, value)

  SetterGetter.reset = ->
    reset(state)

  return SetterGetter

module.exports = {
  create
}
