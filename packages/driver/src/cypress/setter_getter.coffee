_ = require("lodash")

## a basic object setter / getter class
module.exports = {
  create: (state = {}) ->
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

      _.extend(state, obj)

      return ret

    ## return the getter / setter function interface
    return (key, value) ->
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
}
