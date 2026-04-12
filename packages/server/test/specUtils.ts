import mockfs from 'mock-fs'
import path from 'path'

export const getFsPath = (pathStr: string) => {
  const keys = pathStr.split(path.sep).filter(Boolean)
  let current: any = getFs()

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }

    current = current[key]
  }

  return current
}

export const getFs = () => {
  const cwd = process.cwd().split(path.sep).slice(1)

  const recurse = (dir, d) => {
    if (typeof dir === 'string') {
      return dir
    }

    return Object.assign({}, ...Object.entries(dir).map(([key, val]: [string, any]) => {
      let nextDepth = null

      if (d !== null) {
        if (d === -1) {
          nextDepth = d + 1
        } else if (!(d > cwd.length) && key === cwd[d]) {
          key = 'foo'
          nextDepth = d + 1

          if (d === cwd.length - 1) {
            return { '[cwd]': recurse(val._items, nextDepth) }
          }

          return recurse(val._items, nextDepth)
        } else {
          nextDepth = null
        }
      }

      return {
        [key]: recurse(val._content ? val._content.toString() : val._items, nextDepth),
      }
    }))
  }

  return recurse({ root: mockfs.getMockRoot() }, -1).root
}
