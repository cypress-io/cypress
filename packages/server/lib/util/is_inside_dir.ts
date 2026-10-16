import path from 'path'

// Path-traversal guard: true only when `child` resolves to a descendant of `parent`.
export const isInsideDir = (parent: string, child: string): boolean => {
  const rel = path.relative(parent, child)

  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}
