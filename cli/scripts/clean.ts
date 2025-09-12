import fs from 'fs-extra'
import path from 'path'
import { includeTypes } from './utils'

fs.removeSync(path.join(__dirname, '..', 'build'))

includeTypes.forEach((folder: string) => {
  try {
    fs.removeSync(path.join(__dirname, '..', 'types', folder))
  } catch (e: any) {
    //
  }
})
