import { extend, isObject, isString } from 'lodash'

const reset = (state = {}) => {
  // perf loop
  for (let key in state) {
    delete state[key]
  }

  return state
}

// a basic object setter / getter class
export default {
  create: (state = {}, validate?) => {
    const get = (key?) => {
      if (key) {
        return state[key]
      }

      return state
    }

    const set = (key, value?) => {
      let obj
      let ret

      if (isObject(key)) {
        obj = key
        ret = obj
      } else {
        obj = {}
        obj[key] = value
        ret = value
      }

      validate && validate(obj)

      extend(state, obj)

      return ret
    }

    // return the getter / setter function interface
    const SetterGetter = function (key, value) {
      switch (arguments.length) {
        case 0:
          return get()
        case 1:
          if (isString(key)) {
            return get(key)
          }

          return set(key)

        default:
          return set(key, value)
      }
    }

    SetterGetter.reset = () => {
      return reset(state)
    }

    return SetterGetter
  },
}
