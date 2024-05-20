const lodash = require('lodash')

export function whatIsCircular (obj) {
  if (!lodash.isObject(obj)) {
    return
  }

  return _dfs(obj)
}

function _dfs (obj, parents: any[] = [], parentKeys: any[] = []) {
  // recurse depth-first until we hit something we've seen before
  for (const key in obj) {
    const val = obj[key]

    if (lodash.isObject(val)) {
      if (lodash.includes(parents, val)) {
        return parentKeys
      }

      const path = _dfs(val, parents.concat([val]), parentKeys.concat([key]))

      if (path) return path
    }
  }
}
