import glob from 'glob'
import { promisify } from 'util'

export const globAsync = promisify(glob)
