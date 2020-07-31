import _ from 'lodash'

export const remapKeys = (obj, mapObj, parent?, key?) => {
  if (_.isFunction(mapObj)) {
    mapObj(parent, key, obj)

    return
  }

  if (_.isObject(mapObj)) {
    _.each(mapObj, (mapVal, mapKey) => {
      remapKeys(obj[mapKey], mapVal, obj, mapKey)
    })
  }
}

export const remove = (obj, key) => delete obj[key]

export const renameKey = (newName) => {
  return (obj, key, val) => {
    delete obj[key]
    obj[newName] = val
  }
}

export const setValue = (defaultVal) => {
  return (obj, key) => {
    obj[key] = defaultVal
  }
}

export const each = (fn) => {
  return (__, ___, arr) => {
    return _.each(arr, (val, i) => {
      const mapObj = _.isFunction(fn) ? fn(val, i) : fn

      remapKeys(val, mapObj)
    })
  }
}
