import { readdir, stat } from 'fs-extra'
import path from 'path'

// Recursively list every file under `root` as relative paths; non-file entries are ignored.
export const walkFiles = async (root: string, currentRel: string = ''): Promise<string[]> => {
  const fullDir = path.join(root, currentRel)
  const entries = await readdir(fullDir)

  const nested = await Promise.all(entries.map(async (entry): Promise<string[]> => {
    const entryRel = path.join(currentRel, entry)
    const entryFull = path.join(root, entryRel)
    const entryStat = await stat(entryFull)

    if (entryStat.isDirectory()) return walkFiles(root, entryRel)

    if (entryStat.isFile()) return [entryRel]

    return []
  }))

  return nested.flat()
}
