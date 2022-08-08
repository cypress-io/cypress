import { extend, isObject, isString } from 'lodash'

export type SetterGetter<S> = {
  (): S
  <K extends keyof S, T extends S[K]>(key: K): T
  <V extends Partial<S>>(value: V): V
  <K extends keyof S, T extends S[K]>(key: K, value: T): T
  state: S
  reset: () => Record<string, any>
}

const reset = (state = {}) => {
  // perf loop
  for (let key in state) {
    delete state[key]
  }

  return state
}

// a basic object setter / getter class
export default {
  create: (state: Record<string, any> = {}, validate?: Function) => {
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
