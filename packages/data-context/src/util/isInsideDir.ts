import fs from 'fs-extra'
import path from 'path'

// Path-traversal guard: true only when `child` resolves to a descendant of `parent`.
export const isInsideDir = (parent: string, child: string): boolean => {
  const rel = path.relative(parent, child)

  return rel !== '' && rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)
}

// `target` may not exist yet, so resolve symlinks in the longest prefix of it that does
async function realpathOfExistingPrefix (target: string): Promise<string> {
  try {
    return await fs.realpath(target)
  } catch {
    const parent = path.dirname(target)

    if (parent === target) {
      return target
    }

    return path.join(await realpathOfExistingPrefix(parent), path.basename(target))
  }
}

// Like `isInsideDir`, but also rejects a `child` that escapes `parent` through a symlink
export const isInsideDirOnDisk = async (parent: string, child: string): Promise<boolean> => {
  if (!isInsideDir(parent, child)) {
    return false
  }

  return isInsideDir(await realpathOfExistingPrefix(parent), await realpathOfExistingPrefix(child))
}
