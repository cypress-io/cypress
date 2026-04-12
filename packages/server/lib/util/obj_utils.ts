const traverse = (obj, mapObj, parent?, key?) => {
  if (typeof mapObj === 'function') {
    mapObj(parent, key, obj)

    return
  }

  if (mapObj !== null && typeof mapObj === 'object') {
    Object.entries(mapObj).forEach(([mapKey, mapVal]) => {
      traverse(obj[mapKey], mapVal, obj, mapKey)
    })
  }
}

export const remapKeys = (fromObj, toObj) => {
  fromObj = structuredClone(fromObj)

  traverse(fromObj, toObj)

  return fromObj
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
    return arr.forEach((val, i) => {
      const mapObj = typeof fn === 'function' ? fn(val, i) : fn

      traverse(val, mapObj)
    })
  }
}
